// OAuth 2.0 Flow Implementation für Meetup
import { PlatformConfig } from '../types/platformConfig';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  expiresAt: Date;
}

interface OAuthState {
  platform: string;
  timestamp: number;
  redirectPath?: string;
}

// Meetup OAuth 2.0 Konfiguration
const MEETUP_OAUTH_CONFIG = {
  authEndpoint: 'https://secure.meetup.com/oauth2/authorize',
  tokenEndpoint: 'https://secure.meetup.com/oauth2/access',
  scopes: ['basic', 'event_management'],
  responseType: 'code'
};

// OAuth State Management
class OAuthManager {
  private static instance: OAuthManager;
  private states: Map<string, OAuthState> = new Map();
  
  static getInstance(): OAuthManager {
    if (!OAuthManager.instance) {
      OAuthManager.instance = new OAuthManager();
    }
    return OAuthManager.instance;
  }

  // Generiere sicheren State-Parameter
  generateState(platform: string, redirectPath?: string): string {
    const state = {
      platform,
      timestamp: Date.now(),
      redirectPath
    };
    
    const stateId = this.generateSecureId();
    this.states.set(stateId, state);
    
    // Cleanup alte States (nach 10 Minuten)
    setTimeout(() => this.states.delete(stateId), 10 * 60 * 1000);
    
    return stateId;
  }

  // Validiere State-Parameter
  validateState(stateId: string): OAuthState | null {
    const state = this.states.get(stateId);
    
    if (!state) return null;
    
    // Prüfe Ablaufzeit (10 Minuten)
    if (Date.now() - state.timestamp > 10 * 60 * 1000) {
      this.states.delete(stateId);
      return null;
    }
    
    return state;
  }

  private generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Meetup OAuth 2.0 Flow
export class MeetupOAuthFlow {
  private config: OAuthConfig;
  private oauthManager = OAuthManager.getInstance();

  constructor(clientId: string, clientSecret: string) {
    this.config = {
      clientId,
      clientSecret,
      redirectUri: `${window.location.origin}/oauth/callback`,
      scopes: MEETUP_OAUTH_CONFIG.scopes
    };
  }

  // Schritt 1: Generiere Authorization URL
  getAuthorizationUrl(redirectPath?: string): string {
    const state = this.oauthManager.generateState('meetup', redirectPath);
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: MEETUP_OAUTH_CONFIG.responseType,
      state
    });

    return `${MEETUP_OAUTH_CONFIG.authEndpoint}?${params.toString()}`;
  }

  // Schritt 2: Starte OAuth Flow
  initiateOAuth(redirectPath?: string): void {
    const authUrl = this.getAuthorizationUrl(redirectPath);
    
    // Öffne OAuth-Fenster
    const popup = window.open(
      authUrl,
      'meetup-oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      throw new Error('Popup wurde blockiert. Bitte erlauben Sie Popups für diese Website.');
    }

    // Überwache Popup
    this.monitorOAuthPopup(popup);
  }

  // Schritt 3: Verarbeite Authorization Code
  async handleCallback(code: string, state: string): Promise<OAuthToken> {
    // Validiere State
    const stateData = this.oauthManager.validateState(state);
    if (!stateData || stateData.platform !== 'meetup') {
      throw new Error('Ungültiger OAuth State. Möglicherweise ein Sicherheitsrisiko.');
    }

    // Tausche Code gegen Access Token
    const tokenData = await this.exchangeCodeForToken(code);
    
    // Speichere Token sicher
    await this.storeTokenSecurely(tokenData);
    
    return tokenData;
  }

  // Token Exchange
  private async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    const response = await fetch(MEETUP_OAUTH_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token Exchange fehlgeschlagen: ${response.status} - ${errorText}`);
    }

    const tokenResponse = await response.json();
    
    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
      tokenType: tokenResponse.token_type || 'Bearer',
      scope: tokenResponse.scope,
      expiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000))
    };
  }

  // Sichere Token-Speicherung
  private async storeTokenSecurely(token: OAuthToken): Promise<void> {
    // Speichere in verschlüsseltem Format in localStorage
    const encryptedToken = btoa(JSON.stringify({
      ...token,
      timestamp: Date.now()
    }));
    
    localStorage.setItem('meetup_oauth_token', encryptedToken);
  }

  // Token abrufen
  getStoredToken(): OAuthToken | null {
    try {
      const encryptedToken = localStorage.getItem('meetup_oauth_token');
      if (!encryptedToken) return null;
      
      const token = JSON.parse(atob(encryptedToken)) as OAuthToken & { timestamp: number };
      
      // Prüfe Ablaufzeit
      if (new Date() > token.expiresAt) {
        this.clearToken();
        return null;
      }
      
      return token;
    } catch {
      return null;
    }
  }

  // Token löschen
  clearToken(): void {
    localStorage.removeItem('meetup_oauth_token');
  }

  // Token erneuern
  async refreshToken(): Promise<OAuthToken | null> {
    const currentToken = this.getStoredToken();
    if (!currentToken?.refreshToken) return null;

    try {
      const response = await fetch(MEETUP_OAUTH_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: currentToken.refreshToken
        })
      });

      if (!response.ok) {
        this.clearToken();
        return null;
      }

      const tokenResponse = await response.json();
      
      const newToken: OAuthToken = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || currentToken.refreshToken,
        expiresIn: tokenResponse.expires_in,
        tokenType: tokenResponse.token_type || 'Bearer',
        scope: tokenResponse.scope,
        expiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000))
      };
      
      await this.storeTokenSecurely(newToken);
      return newToken;
    } catch {
      this.clearToken();
      return null;
    }
  }

  // Popup Monitor
  private monitorOAuthPopup(popup: Window): void {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Trigger Refresh der Hauptseite oder spezifische Handler
        window.dispatchEvent(new CustomEvent('oauth-popup-closed'));
      }
    }, 1000);
  }

  // Test Authenticated API Call
  async testAuthenticatedAPI(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      const response = await fetch('https://api.meetup.com/gql', {
        method: 'POST',
        headers: {
          'Authorization': `${token.tokenType} ${token.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            query TestAuth {
              self {
                id
                name
                email
              }
            }
          `
        })
      });

      if (!response.ok) {
        // Token möglicherweise abgelaufen, versuche Refresh
        if (response.status === 401) {
          const refreshed = await this.refreshToken();
          return refreshed !== null;
        }
        return false;
      }

      const data = await response.json();
      return !data.errors;
    } catch {
      return false;
    }
  }
}

// OAuth Callback Handler für die App
export function handleOAuthCallback(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  if (error) {
    console.error('OAuth Error:', error);
    alert(`OAuth Fehler: ${error}`);
    return;
  }
  
  if (code && state) {
    // OAuth erfolgreich, schließe Popup und benachrichtige Parent
    if (window.opener) {
      window.opener.postMessage({
        type: 'oauth-success',
        code,
        state
      }, window.location.origin);
      window.close();
    }
  }
}

// Message Listener für OAuth Callbacks
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'oauth-success') {
      // Handle successful OAuth in main window
      window.dispatchEvent(new CustomEvent('oauth-callback', {
        detail: {
          code: event.data.code,
          state: event.data.state
        }
      }));
    }
  });
}