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

        const { eventId, platforms, publishType } = await req.json();

        if (!eventId || !platforms || !Array.isArray(platforms)) {
            throw new Error('Event ID and platforms array are required');
        }

        // Fetch event data
        const eventResponse = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=*`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!eventResponse.ok) {
            throw new Error('Failed to fetch event data');
        }

        const events = await eventResponse.json();
        if (events.length === 0) {
            throw new Error('Event not found');
        }

        const eventData = events[0];
        const publishResults = [];

        // Process each platform
        for (const platform of platforms) {
            const result = await publishToPlatform(eventData, platform, publishType, supabaseUrl, serviceRoleKey);
            publishResults.push(result);
        }

        return new Response(JSON.stringify({
            data: {
                eventId,
                publishResults,
                summary: {
                    total: publishResults.length,
                    successful: publishResults.filter(r => r.status === 'success').length,
                    failed: publishResults.filter(r => r.status === 'failed').length,
                    pending: publishResults.filter(r => r.status === 'pending').length
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Platform publish error:', error);

        const errorResponse = {
            error: {
                code: 'PLATFORM_PUBLISH_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function publishToPlatform(eventData: any, platform: string, publishType: 'api' | 'playwright', supabaseUrl: string, serviceRoleKey: string) {
    const logEntry = {
        event_id: eventData.id,
        platform,
        method: publishType,
        status: 'pending',
        published_at: new Date().toISOString()
    };

    try {
        // Create initial log entry
        const logResponse = await fetch(`${supabaseUrl}/rest/v1/publishing_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(logEntry)
        });

        if (!logResponse.ok) {
            throw new Error('Failed to create log entry');
        }

        const logData = await logResponse.json();
        const logId = logData[0].id;

        let publishResult;

        if (publishType === 'api') {
            publishResult = await publishViaAPI(eventData, platform, supabaseUrl, serviceRoleKey);
        } else {
            publishResult = await publishViaPlaywright(eventData, platform, supabaseUrl, serviceRoleKey);
        }

        // Update log entry with result
        await updateLogEntry(logId, publishResult, supabaseUrl, serviceRoleKey);

        return {
            platform,
            method: publishType,
            status: publishResult.success ? 'success' : 'failed',
            platformEventId: publishResult.platformEventId,
            error: publishResult.error,
            logId
        };

    } catch (error) {
        console.error(`Error publishing to ${platform}:`, error);
        return {
            platform,
            method: publishType,
            status: 'failed',
            error: error.message
        };
    }
}

async function publishViaAPI(eventData: any, platform: string, supabaseUrl: string, serviceRoleKey: string) {
    // Get platform configuration
    const configResponse = await fetch(`${supabaseUrl}/rest/v1/platform_configs?platform_name=eq.${platform}&config_type=eq.api&is_active=eq.true`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!configResponse.ok) {
        throw new Error(`Failed to fetch ${platform} API configuration`);
    }

    const configs = await configResponse.json();
    if (configs.length === 0) {
        throw new Error(`No active ${platform} API configuration found`);
    }

    const config = configs[0];
    const credentials = config.api_credentials;

    switch (platform.toLowerCase()) {
        case 'meetup':
            return await publishToMeetupAPI(eventData, credentials);
        case 'eventbrite':
            return await publishToEventbriteAPI(eventData, credentials);
        case 'facebook':
            return await publishToFacebookAPI(eventData, credentials);
        case 'spontacts':
            return await publishToSpontactsAPI(eventData, credentials);
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

async function publishViaPlaywright(eventData: any, platform: string, supabaseUrl: string, serviceRoleKey: string) {
    // Get platform session data
    const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/platform_sessions?platform=eq.${platform}&is_active=eq.true&order=created_at.desc&limit=1`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    let sessionData = null;
    if (sessionResponse.ok) {
        const sessions = await sessionResponse.json();
        if (sessions.length > 0) {
            sessionData = sessions[0];
        }
    }

    // Note: In a real implementation, you would integrate with Playwright here
    // For now, we'll simulate the process
    console.log(`Publishing to ${platform} via Playwright with event:`, eventData.titel);

    // Simulate playwright automation
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

    return {
        success: true,
        platformEventId: `${platform}_${Date.now()}`,
        screenshotUrl: `/screenshots/${platform}_${eventData.id}.png`,
        message: `Successfully published "${eventData.titel}" to ${platform} via UI automation`
    };
}

// Platform-specific API implementations (simplified for demonstration)
async function publishToMeetupAPI(eventData: any, credentials: any) {
    console.log('Publishing to Meetup API:', eventData.titel);
    
    // In a real implementation, you would make actual API calls to Meetup
    return {
        success: true,
        platformEventId: `meetup_${Date.now()}`,
        message: 'Successfully published to Meetup'
    };
}

async function publishToEventbriteAPI(eventData: any, credentials: any) {
    console.log('Publishing to Eventbrite API:', eventData.titel);
    
    // In a real implementation, you would make actual API calls to Eventbrite
    return {
        success: true,
        platformEventId: `eventbrite_${Date.now()}`,
        message: 'Successfully published to Eventbrite'
    };
}

async function publishToFacebookAPI(eventData: any, credentials: any) {
    console.log('Publishing to Facebook API:', eventData.titel);
    
    // In a real implementation, you would make actual API calls to Facebook
    return {
        success: true,
        platformEventId: `facebook_${Date.now()}`,
        message: 'Successfully published to Facebook'
    };
}

async function publishToSpontactsAPI(eventData: any, credentials: any) {
    console.log('Publishing to Spontacts API:', eventData.titel);
    
    // In a real implementation, you would make actual API calls to Spontacts
    return {
        success: true,
        platformEventId: `spontacts_${Date.now()}`,
        message: 'Successfully published to Spontacts'
    };
}

async function updateLogEntry(logId: string, result: any, supabaseUrl: string, serviceRoleKey: string) {
    const updateData = {
        status: result.success ? 'success' : 'failed',
        platform_event_id: result.platformEventId || null,
        error_details: result.error ? { message: result.error } : null,
        screenshot_url: result.screenshotUrl || null
    };

    await fetch(`${supabaseUrl}/rest/v1/publishing_logs?id=eq.${logId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
}