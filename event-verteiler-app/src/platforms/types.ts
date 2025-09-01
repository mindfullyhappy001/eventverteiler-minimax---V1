import type { Event } from '@/lib/supabase'

// Einheitliches Interface für alle Plattformen
export interface PlatformInterface {
  createEvent(eventData: Event): Promise<PlatformResult>
  verifyEvent(eventId: string): Promise<VerificationResult>
  updateEvent(eventId: string, eventData: Event): Promise<PlatformResult>
  deleteEvent(eventId: string): Promise<PlatformResult>
}

export interface PlatformResult {
  success: boolean
  platformEventId?: string
  error?: string
  screenshotUrl?: string // Nur für Playwright
}

export interface VerificationResult {
  verified: boolean
  eventData?: any
  error?: string
  screenshotUrl?: string // Nur für Playwright
}

export interface PlaywrightInterface extends PlatformInterface {
  saveSession(): Promise<SessionResult>
  restoreSession(sessionData: any): Promise<SessionResult>
}

export interface SessionResult {
  success: boolean
  sessionData?: any
  error?: string
}

export type SupportedPlatform = 'meetup' | 'eventbrite' | 'facebook' | 'spontacts'
export type IntegrationMethod = 'api' | 'playwright'

export interface PlatformConfig {
  platform: SupportedPlatform
  method: IntegrationMethod
  apiConfig?: any
  playwrightSettings?: any
  isActive: boolean
}

export interface PlatformCredentials {
  meetup?: {
    api?: {
      accessToken: string
      groupId: string
      clientId: string
      clientSecret: string
    }
    playwright?: {
      email: string
      password: string
      groupUrl: string
    }
  }
  eventbrite?: {
    api?: {
      accessToken: string
      organizationId: string
    }
    playwright?: {
      email: string
      password: string
      organizationId: string
    }
  }
  facebook?: {
    api?: {
      accessToken: string
      pageId: string
      appId: string
      appSecret: string
    }
    playwright?: {
      email: string
      password: string
      pageId: string
      businessManagerUrl: string
    }
  }
  spontacts?: {
    api?: {
      apiKey?: string
      authToken?: string
    }
    playwright?: {
      email: string
      password: string
      profileUrl: string
      defaultCity: string
    }
  }
}