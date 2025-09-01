Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const { action, data } = await req.json();

        switch (action) {
            case 'export':
                return await exportEventsToCSV(supabaseUrl, serviceRoleKey, corsHeaders);
            case 'import':
                return await importEventsFromCSV(data.csvData, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'template':
                return await generateCSVTemplate(corsHeaders);
            case 'validate':
                return await validateCSVData(data.csvData, corsHeaders);
            default:
                throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('CSV handler error:', error);

        const errorResponse = {
            error: {
                code: 'CSV_HANDLER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function exportEventsToCSV(supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Fetch all events
    const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch events for export');
    }

    const events = await response.json();

    // Convert to CSV
    const csvContent = convertEventsToCSV(events);

    return new Response(JSON.stringify({
        data: {
            csvContent,
            filename: `events_export_${new Date().toISOString().split('T')[0]}.csv`,
            totalEvents: events.length
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function importEventsFromCSV(csvData: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!csvData) {
        throw new Error('CSV data is required');
    }

    const events = parseCSVToEvents(csvData);
    const validationResult = validateEventsData(events);

    if (validationResult.errors.length > 0) {
        return new Response(JSON.stringify({
            data: {
                success: false,
                errors: validationResult.errors,
                validEvents: validationResult.validEvents.length,
                totalRows: events.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Import valid events
    const importResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (const event of validationResult.validEvents) {
        try {
            const eventToCreate = {
                ...event,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(eventToCreate)
            });

            if (response.ok) {
                const createdEvent = await response.json();
                importResults.push({
                    success: true,
                    event: createdEvent[0],
                    originalRow: event.originalRow || null
                });
                successCount++;
            } else {
                const errorText = await response.text();
                importResults.push({
                    success: false,
                    error: errorText,
                    originalRow: event.originalRow || null
                });
                errorCount++;
            }
        } catch (error) {
            importResults.push({
                success: false,
                error: error.message,
                originalRow: event.originalRow || null
            });
            errorCount++;
        }
    }

    return new Response(JSON.stringify({
        data: {
            success: true,
            importResults,
            summary: {
                totalProcessed: events.length,
                successful: successCount,
                failed: errorCount,
                validationErrors: validationResult.errors.length
            }
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function generateCSVTemplate(corsHeaders: any) {
    const templateHeaders = [
        'titel',
        'beschreibung',
        'datum',
        'uhrzeit',
        'ort',
        'kategorie',
        'tags',
        'preis',
        'event_typ',
        'bilder_urls',
        'veranstalter',
        'url'
    ];

    const sampleRow = [
        'Beispiel Event',
        'Dies ist eine Beispielbeschreibung für ein Event.',
        '2025-09-15',
        '18:00:00',
        'Berlin, Deutschland',
        'Technologie',
        'tech,innovation,networking',
        'Kostenlos',
        'live',
        'https://example.com/image1.jpg,https://example.com/image2.jpg',
        'Max Mustermann',
        'https://example.com/event'
    ];

    const csvTemplate = [templateHeaders.join(','), sampleRow.join(',')].join('\n');

    return new Response(JSON.stringify({
        data: {
            csvTemplate,
            filename: 'event_import_template.csv',
            headers: templateHeaders
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function validateCSVData(csvData: string, corsHeaders: any) {
    if (!csvData) {
        throw new Error('CSV data is required');
    }

    const events = parseCSVToEvents(csvData);
    const validationResult = validateEventsData(events);

    return new Response(JSON.stringify({
        data: {
            isValid: validationResult.errors.length === 0,
            errors: validationResult.errors,
            validEvents: validationResult.validEvents.length,
            totalRows: events.length,
            preview: validationResult.validEvents.slice(0, 5) // First 5 valid events
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

function convertEventsToCSV(events: any[]): string {
    if (events.length === 0) {
        return 'titel,beschreibung,datum,uhrzeit,ort,kategorie,tags,preis,event_typ,bilder_urls,veranstalter,url';
    }

    const headers = 'titel,beschreibung,datum,uhrzeit,ort,kategorie,tags,preis,event_typ,bilder_urls,veranstalter,url';
    
    const rows = events.map(event => {
        return [
            escapeCSVField(event.titel || ''),
            escapeCSVField(event.beschreibung || ''),
            event.datum || '',
            event.uhrzeit || '',
            escapeCSVField(event.ort || ''),
            escapeCSVField(event.kategorie || ''),
            Array.isArray(event.tags) ? event.tags.join(',') : '',
            escapeCSVField(event.preis || ''),
            event.event_typ || '',
            Array.isArray(event.bilder_urls) ? event.bilder_urls.join(',') : '',
            escapeCSVField(event.veranstalter || ''),
            event.url || ''
        ].join(',');
    });

    return [headers, ...rows].join('\n');
}

function parseCSVToEvents(csvData: string): any[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV must contain at least header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const events = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
            continue; // Skip malformed rows
        }

        const event: any = { originalRow: i + 1 };
        
        headers.forEach((header, index) => {
            const value = values[index]?.trim() || '';
            
            switch (header) {
                case 'tags':
                    event.tags = value ? value.split(',').map(t => t.trim()) : [];
                    break;
                case 'bilder_urls':
                    event.bilder_urls = value ? value.split(',').map(u => u.trim()) : [];
                    break;
                default:
                    event[header] = value || null;
            }
        });

        events.push(event);
    }

    return events;
}

function validateEventsData(events: any[]): { validEvents: any[], errors: string[] } {
    const validEvents = [];
    const errors = [];

    for (const event of events) {
        const eventErrors = [];

        // Required field validation
        if (!event.titel || event.titel.trim() === '') {
            eventErrors.push(`Row ${event.originalRow}: Titel is required`);
        }

        // Date validation
        if (event.datum && !isValidDate(event.datum)) {
            eventErrors.push(`Row ${event.originalRow}: Invalid date format (use YYYY-MM-DD)`);
        }

        // Time validation
        if (event.uhrzeit && !isValidTime(event.uhrzeit)) {
            eventErrors.push(`Row ${event.originalRow}: Invalid time format (use HH:MM:SS)`);
        }

        // Event type validation
        if (event.event_typ && !['virtual', 'live', 'hybrid'].includes(event.event_typ)) {
            eventErrors.push(`Row ${event.originalRow}: Event type must be 'virtual', 'live', or 'hybrid'`);
        }

        if (eventErrors.length === 0) {
            validEvents.push(event);
        } else {
            errors.push(...eventErrors);
        }
    }

    return { validEvents, errors };
}

function escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

function isValidTime(timeString: string): boolean {
    return timeString.match(/^\d{2}:\d{2}(:\d{2})?$/) !== null;
}