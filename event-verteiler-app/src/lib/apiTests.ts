// Echte API-Test-Implementierungen für alle Plattformen

export type PlatformKey = 'meetup' | 'eventbrite' | 'facebook' | 'spontacts';

interface PlatformConfig {
  apiEnabled: boolean;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  playwrightEnabled: boolean;
  username?: string;
  password?: string;
  sessionData?: any;
  apiStatus: 'connected' | 'disconnected' | 'testing';
  lastTest?: Date;
}

interface APITestResult {
  success: boolean;
  error?: string;
  details?: any;
}

// Meetup GraphQL API Test (OAuth 2.0)
export async function testMeetupAPI(config: PlatformConfig): Promise<APITestResult> {
  if (!config.clientId || !config.clientSecret) {
    return {
      success: false,
      error: 'Client ID und Client Secret sind für OAuth 2.0 erforderlich'
    };
  }

  try {
    // OAuth 2.0 Token-Endpoint für Client Credentials Flow
    const tokenResponse = await fetch('https://secure.meetup.com/oauth2/access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      return {
        success: false,
        error: `OAuth Token-Fehler: ${tokenResponse.status} - ${errorData}`
      };
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return {
        success: false,
        error: 'Kein Access Token erhalten. Überprüfen Sie Client ID und Secret.'
      };
    }

    // Test GraphQL Query mit dem erhaltenen Token
    const graphqlResponse = await fetch('https://api.meetup.com/gql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          query TestConnection {
            self {
              id
              name
            }
          }
        `
      })
    });

    if (!graphqlResponse.ok) {
      return {
        success: false,
        error: `GraphQL API-Fehler: ${graphqlResponse.status}`
      };
    }

    const graphqlData = await graphqlResponse.json();
    
    if (graphqlData.errors) {
      return {
        success: false,
        error: `GraphQL-Fehler: ${graphqlData.errors[0]?.message || 'Unbekannter GraphQL-Fehler'}`
      };
    }

    return {
      success: true,
      details: {
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        userInfo: graphqlData.data?.self
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

// Eventbrite REST API Test
export async function testEventbriteAPI(config: PlatformConfig): Promise<APITestResult> {
  if (!config.apiKey) {
    return {
      success: false,
      error: 'API-Key ist erforderlich'
    };
  }

  try {
    // Test mit User-Info Endpoint
    const response = await fetch('https://www.eventbriteapi.com/v3/users/me/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `API-Fehler: ${response.status} - ${errorData.error_description || 'Ungültiger API-Key'}`
      };
    }

    const userData = await response.json();
    
    return {
      success: true,
      details: {
        userId: userData.id,
        name: userData.name,
        email: userData.emails?.[0]?.email,
        organization: userData.organization
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

// Facebook Events API Test (nur für Marketing Partner)
export async function testFacebookAPI(config: PlatformConfig): Promise<APITestResult> {
  // Facebook Events API ist nur für Marketing Partner verfügbar
  return {
    success: false,
    error: 'Facebook Events API ist nur für zertifizierte Marketing Partner verfügbar. Verwenden Sie UI-Automation stattdessen.'
  };
}

// Spontacts API Test (keine öffentliche API verfügbar)
export async function testSpontactsAPI(config: PlatformConfig): Promise<APITestResult> {
  // Spontacts hat keine öffentliche API
  return {
    success: false,
    error: 'Spontacts bietet keine öffentliche API. Nur UI-Automation ist verfügbar. Für API-Zugang kontaktieren Sie support@synexit.com'
  };
}

// Haupt-Test-Funktion für alle Plattformen
export async function testPlatformAPI(platform: PlatformKey, config: PlatformConfig): Promise<APITestResult> {
  switch (platform) {
    case 'meetup':
      return await testMeetupAPI(config);
    
    case 'eventbrite':
      return await testEventbriteAPI(config);
    
    case 'facebook':
      return await testFacebookAPI(config);
    
    case 'spontacts':
      return await testSpontactsAPI(config);
    
    default:
      return {
        success: false,
        error: 'Unbekannte Plattform'
      };
  }
}

// CORS-Proxy Fallback für Development (falls benötigt)
const CORS_PROXY = process.env.NODE_ENV === 'development' ? 'https://cors-anywhere.herokuapp.com/' : '';

// Helper Funktion für CORS-Probleme in Development
export function buildAPIUrl(url: string): string {
  return CORS_PROXY + url;
}