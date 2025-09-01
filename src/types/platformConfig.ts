// Platform-Konfiguration Interface
export interface PlatformConfig {
  // API-Sektion
  apiEnabled: boolean;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  
  // Playwright-Sektion  
  playwrightEnabled: boolean;
  username?: string;
  password?: string;
  sessionData?: any;
  
  // Status
  apiStatus: 'connected' | 'disconnected' | 'testing';
  lastTest?: Date;
}

export interface PlatformConfigs {
  meetup: PlatformConfig;
  eventbrite: PlatformConfig;
  facebook: PlatformConfig;
  spontacts: PlatformConfig;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  apiEnabled: false,
  playwrightEnabled: false,
  apiStatus: 'disconnected'
};

export const PLATFORM_NAMES = {
  meetup: 'Meetup',
  eventbrite: 'Eventbrite', 
  facebook: 'Facebook Events',
  spontacts: 'Spontacts'
} as const;

export type PlatformKey = keyof typeof PLATFORM_NAMES;
