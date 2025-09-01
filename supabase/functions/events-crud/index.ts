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

        const { action, data, eventId, filters } = await req.json();

        switch (action) {
            case 'create':
                return await createEvent(data, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'read':
                return await getEvents(filters, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'update':
                return await updateEvent(eventId, data, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'delete':
                return await deleteEvent(eventId, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'get_single':
                return await getSingleEvent(eventId, supabaseUrl, serviceRoleKey, corsHeaders);
            default:
                throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('Events CRUD error:', error);

        const errorResponse = {
            error: {
                code: 'EVENTS_CRUD_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function createEvent(eventData: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Validate required fields
    if (!eventData.titel) {
        throw new Error('Event title is required');
    }

    const eventToCreate = {
        titel: eventData.titel,
        beschreibung: eventData.beschreibung || null,
        datum: eventData.datum || null,
        uhrzeit: eventData.uhrzeit || null,
        ort: eventData.ort || null,
        kategorie: eventData.kategorie || null,
        tags: eventData.tags || [],
        preis: eventData.preis || null,
        event_typ: eventData.event_typ || 'live',
        bilder_urls: eventData.bilder_urls || [],
        veranstalter: eventData.veranstalter || null,
        url: eventData.url || null,
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

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create event: ${errorText}`);
    }

    const createdEvent = await response.json();

    return new Response(JSON.stringify({
        data: createdEvent[0]
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getEvents(filters: any = {}, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    let url = `${supabaseUrl}/rest/v1/events?select=*&order=created_at.desc`;

    // Apply filters if provided
    if (filters.kategorie) {
        url += `&kategorie=eq.${filters.kategorie}`;
    }
    if (filters.event_typ) {
        url += `&event_typ=eq.${filters.event_typ}`;
    }
    if (filters.datum_from) {
        url += `&datum=gte.${filters.datum_from}`;
    }
    if (filters.datum_to) {
        url += `&datum=lte.${filters.datum_to}`;
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch events: ${errorText}`);
    }

    const events = await response.json();

    return new Response(JSON.stringify({
        data: events
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getSingleEvent(eventId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!eventId) {
        throw new Error('Event ID is required');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=*`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch event: ${errorText}`);
    }

    const events = await response.json();

    if (events.length === 0) {
        throw new Error('Event not found');
    }

    return new Response(JSON.stringify({
        data: events[0]
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function updateEvent(eventId: string, eventData: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!eventId) {
        throw new Error('Event ID is required');
    }

    const updateData = {
        ...eventData,
        updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;

    const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${eventId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update event: ${errorText}`);
    }

    const updatedEvent = await response.json();

    if (updatedEvent.length === 0) {
        throw new Error('Event not found');
    }

    return new Response(JSON.stringify({
        data: updatedEvent[0]
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function deleteEvent(eventId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!eventId) {
        throw new Error('Event ID is required');
    }

    // First, delete associated publishing logs
    await fetch(`${supabaseUrl}/rest/v1/publishing_logs?event_id=eq.${eventId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    // Then delete the event
    const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${eventId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete event: ${errorText}`);
    }

    return new Response(JSON.stringify({
        data: { message: 'Event deleted successfully' }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}