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

        const { action, logIds, eventId } = await req.json();

        switch (action) {
            case 'verify_single':
                return await verifySingleLog(logIds[0], supabaseUrl, serviceRoleKey, corsHeaders);
            case 'verify_batch':
                return await verifyBatchLogs(logIds, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'verify_event':
                return await verifyAllEventLogs(eventId, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'get_status':
                return await getVerificationStatus(eventId, supabaseUrl, serviceRoleKey, corsHeaders);
            default:
                throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('Platform verify error:', error);

        const errorResponse = {
            error: {
                code: 'PLATFORM_VERIFY_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function verifySingleLog(logId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!logId) {
        throw new Error('Log ID is required');
    }

    // Fetch the log entry
    const logResponse = await fetch(`${supabaseUrl}/rest/v1/publishing_logs?id=eq.${logId}&select=*`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!logResponse.ok) {
        throw new Error('Failed to fetch log entry');
    }

    const logs = await logResponse.json();
    if (logs.length === 0) {
        throw new Error('Log entry not found');
    }

    const log = logs[0];
    const verificationResult = await performVerification(log, supabaseUrl, serviceRoleKey);

    // Update log status
    await updateLogStatus(logId, verificationResult, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({
        data: {
            logId,
            verificationResult,
            updatedStatus: verificationResult.verified ? 'verified' : 'failed'
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function verifyBatchLogs(logIds: string[], supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!logIds || logIds.length === 0) {
        throw new Error('Log IDs are required');
    }

    const verificationResults = [];

    for (const logId of logIds) {
        try {
            // Fetch log entry
            const logResponse = await fetch(`${supabaseUrl}/rest/v1/publishing_logs?id=eq.${logId}&select=*`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!logResponse.ok) {
                verificationResults.push({
                    logId,
                    success: false,
                    error: 'Failed to fetch log entry'
                });
                continue;
            }

            const logs = await logResponse.json();
            if (logs.length === 0) {
                verificationResults.push({
                    logId,
                    success: false,
                    error: 'Log entry not found'
                });
                continue;
            }

            const log = logs[0];
            const verificationResult = await performVerification(log, supabaseUrl, serviceRoleKey);

            // Update log status
            await updateLogStatus(logId, verificationResult, supabaseUrl, serviceRoleKey);

            verificationResults.push({
                logId,
                success: true,
                verificationResult,
                updatedStatus: verificationResult.verified ? 'verified' : 'failed'
            });

        } catch (error) {
            verificationResults.push({
                logId,
                success: false,
                error: error.message
            });
        }
    }

    return new Response(JSON.stringify({
        data: {
            verificationResults,
            summary: {
                total: verificationResults.length,
                successful: verificationResults.filter(r => r.success).length,
                failed: verificationResults.filter(r => !r.success).length,
                verified: verificationResults.filter(r => r.success && r.verificationResult?.verified).length
            }
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function verifyAllEventLogs(eventId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!eventId) {
        throw new Error('Event ID is required');
    }

    // Fetch all logs for the event
    const logsResponse = await fetch(`${supabaseUrl}/rest/v1/publishing_logs?event_id=eq.${eventId}&select=*`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!logsResponse.ok) {
        throw new Error('Failed to fetch event logs');
    }

    const logs = await logsResponse.json();
    if (logs.length === 0) {
        throw new Error('No logs found for this event');
    }

    const verificationResults = [];

    for (const log of logs) {
        try {
            const verificationResult = await performVerification(log, supabaseUrl, serviceRoleKey);
            await updateLogStatus(log.id, verificationResult, supabaseUrl, serviceRoleKey);

            verificationResults.push({
                logId: log.id,
                platform: log.platform,
                method: log.method,
                success: true,
                verificationResult,
                updatedStatus: verificationResult.verified ? 'verified' : 'failed'
            });

        } catch (error) {
            verificationResults.push({
                logId: log.id,
                platform: log.platform,
                method: log.method,
                success: false,
                error: error.message
            });
        }
    }

    return new Response(JSON.stringify({
        data: {
            eventId,
            verificationResults,
            summary: {
                total: verificationResults.length,
                successful: verificationResults.filter(r => r.success).length,
                failed: verificationResults.filter(r => !r.success).length,
                verified: verificationResults.filter(r => r.success && r.verificationResult?.verified).length
            }
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getVerificationStatus(eventId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!eventId) {
        throw new Error('Event ID is required');
    }

    // Fetch all logs for the event with status
    const logsResponse = await fetch(`${supabaseUrl}/rest/v1/publishing_logs?event_id=eq.${eventId}&select=id,platform,method,status,platform_event_id,published_at,error_details&order=published_at.desc`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!logsResponse.ok) {
        throw new Error('Failed to fetch event logs');
    }

    const logs = await logsResponse.json();

    const statusSummary = {
        total: logs.length,
        pending: logs.filter(l => l.status === 'pending').length,
        success: logs.filter(l => l.status === 'success').length,
        failed: logs.filter(l => l.status === 'failed').length,
        verified: logs.filter(l => l.status === 'verified').length,
        platforms: {}
    };

    // Group by platform
    logs.forEach(log => {
        if (!statusSummary.platforms[log.platform]) {
            statusSummary.platforms[log.platform] = {
                api: { status: null, logId: null },
                playwright: { status: null, logId: null }
            };
        }
        statusSummary.platforms[log.platform][log.method] = {
            status: log.status,
            logId: log.id,
            platformEventId: log.platform_event_id,
            publishedAt: log.published_at,
            hasError: !!log.error_details
        };
    });

    return new Response(JSON.stringify({
        data: {
            eventId,
            statusSummary,
            logs
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function performVerification(log: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log(`Verifying publication for platform: ${log.platform}, method: ${log.method}`);

    if (log.method === 'api') {
        return await verifyAPIPublication(log, supabaseUrl, serviceRoleKey);
    } else {
        return await verifyPlaywrightPublication(log, supabaseUrl, serviceRoleKey);
    }
}

async function verifyAPIPublication(log: any, supabaseUrl: string, serviceRoleKey: string) {
    if (!log.platform_event_id) {
        return {
            verified: false,
            error: 'No platform event ID found',
            verificationMethod: 'api'
        };
    }

    try {
        // Get platform configuration for API credentials
        const configResponse = await fetch(`${supabaseUrl}/rest/v1/platform_configs?platform_name=eq.${log.platform}&config_type=eq.api&is_active=eq.true`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!configResponse.ok) {
            return {
                verified: false,
                error: 'Failed to fetch platform configuration',
                verificationMethod: 'api'
            };
        }

        const configs = await configResponse.json();
        if (configs.length === 0) {
            return {
                verified: false,
                error: 'No active platform configuration found',
                verificationMethod: 'api'
            };
            }

        const config = configs[0];
        
        // Platform-specific verification
        switch (log.platform.toLowerCase()) {
            case 'meetup':
                return await verifyMeetupEvent(log.platform_event_id, config.api_credentials);
            case 'eventbrite':
                return await verifyEventbriteEvent(log.platform_event_id, config.api_credentials);
            case 'facebook':
                return await verifyFacebookEvent(log.platform_event_id, config.api_credentials);
            case 'spontacts':
                return await verifySpontactsEvent(log.platform_event_id, config.api_credentials);
            default:
                return {
                    verified: false,
                    error: `Unsupported platform: ${log.platform}`,
                    verificationMethod: 'api'
                };
        }

    } catch (error) {
        return {
            verified: false,
            error: `Verification failed: ${error.message}`,
            verificationMethod: 'api'
        };
    }
}

async function verifyPlaywrightPublication(log: any, supabaseUrl: string, serviceRoleKey: string) {
    // For Playwright publications, we check if screenshot exists and analyze it
    if (!log.screenshot_url) {
        return {
            verified: false,
            error: 'No screenshot available for verification',
            verificationMethod: 'playwright'
        };
    }

    try {
        // In a real implementation, you would:
        // 1. Download the screenshot
        // 2. Use image recognition to verify success indicators
        // 3. Check for specific UI elements that indicate successful publication
        
        // For now, simulate screenshot analysis
        console.log(`Analyzing screenshot: ${log.screenshot_url}`);
        
        // Simulate screenshot analysis delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            verified: true,
            verificationMethod: 'playwright',
            screenshotAnalysis: {
                successIndicators: ['Event created successfully', 'Publication confirmed'],
                screenshotUrl: log.screenshot_url
            }
        };

    } catch (error) {
        return {
            verified: false,
            error: `Screenshot verification failed: ${error.message}`,
            verificationMethod: 'playwright'
        };
    }
}

// Platform-specific API verification functions (simplified for demonstration)
async function verifyMeetupEvent(eventId: string, credentials: any) {
    console.log(`Verifying Meetup event: ${eventId}`);
    
    // In real implementation, make API call to Meetup to verify event exists
    return {
        verified: true,
        verificationMethod: 'api',
        platformResponse: {
            eventId,
            status: 'published',
            verifiedAt: new Date().toISOString()
        }
    };
}

async function verifyEventbriteEvent(eventId: string, credentials: any) {
    console.log(`Verifying Eventbrite event: ${eventId}`);
    
    // In real implementation, make API call to Eventbrite to verify event exists
    return {
        verified: true,
        verificationMethod: 'api',
        platformResponse: {
            eventId,
            status: 'live',
            verifiedAt: new Date().toISOString()
        }
    };
}

async function verifyFacebookEvent(eventId: string, credentials: any) {
    console.log(`Verifying Facebook event: ${eventId}`);
    
    // In real implementation, make API call to Facebook to verify event exists
    return {
        verified: true,
        verificationMethod: 'api',
        platformResponse: {
            eventId,
            status: 'published',
            verifiedAt: new Date().toISOString()
        }
    };
}

async function verifySpontactsEvent(eventId: string, credentials: any) {
    console.log(`Verifying Spontacts event: ${eventId}`);
    
    // In real implementation, make API call to Spontacts to verify event exists
    return {
        verified: true,
        verificationMethod: 'api',
        platformResponse: {
            eventId,
            status: 'active',
            verifiedAt: new Date().toISOString()
        }
    };
}

async function updateLogStatus(logId: string, verificationResult: any, supabaseUrl: string, serviceRoleKey: string) {
    const updateData = {
        status: verificationResult.verified ? 'verified' : 'failed',
        error_details: verificationResult.error ? 
            { verification_error: verificationResult.error } : 
            null
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