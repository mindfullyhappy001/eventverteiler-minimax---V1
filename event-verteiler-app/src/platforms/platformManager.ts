import type { Event } from '@/lib/supabase'
import type { 
  SupportedPlatform, 
  IntegrationMethod, 
  PlatformInterface, 
  PlatformResult, 
  VerificationResult,
  PlatformCredentials 
} from './types'

// Platform API imports
import { MeetupAPI } from './meetup/api/meetupAPI'
import { EventbriteAPI } from './eventbrite/api/eventbriteAPI'
import { FacebookAPI } from './facebook/api/facebookAPI'
import { SpontactsAPI } from './spontacts/api/spontactsAPI'

// Platform Playwright imports
import { MeetupPlaywright } from './meetup/playwright/meetupPlaywright'
import { EventbritePlaywright } from './eventbrite/playwright/eventbritePlaywright'
import { FacebookPlaywright } from './facebook/playwright/facebookPlaywright'
import { SpontactsPlaywright } from './spontacts/playwright/spontactsPlaywright'

export class PlatformManager {
  private credentials: PlatformCredentials
  private platforms: Map<string, PlatformInterface> = new Map()

  constructor(credentials: PlatformCredentials) {
    this.credentials = credentials
    this.initializePlatforms()
  }

  private initializePlatforms() {
    // Initialize API platforms
    if (this.credentials.meetup?.api) {
      this.platforms.set('meetup-api', new MeetupAPI({
        accessToken: this.credentials.meetup.api.accessToken,
        groupId: this.credentials.meetup.api.groupId,
        oauth: {
          clientId: this.credentials.meetup.api.clientId,
          clientSecret: this.credentials.meetup.api.clientSecret,
          redirectUri: ''
        }
      }))
    }

    if (this.credentials.eventbrite?.api) {
      this.platforms.set('eventbrite-api', new EventbriteAPI({
        accessToken: this.credentials.eventbrite.api.accessToken,
        organizationId: this.credentials.eventbrite.api.organizationId,
        oauth: {
          clientId: '',
          clientSecret: '',
          redirectUri: ''
        }
      }))
    }

    if (this.credentials.facebook?.api) {
      this.platforms.set('facebook-api', new FacebookAPI({
        accessToken: this.credentials.facebook.api.accessToken,
        pageId: this.credentials.facebook.api.pageId,
        appId: this.credentials.facebook.api.appId,
        appSecret: this.credentials.facebook.api.appSecret,
        oauth: {
          redirectUri: ''
        }
      }))
    }

    if (this.credentials.spontacts?.api) {
      this.platforms.set('spontacts-api', new SpontactsAPI({
        apiKey: this.credentials.spontacts.api.apiKey,
        baseUrl: 'https://api.spontacts.com',
        authToken: this.credentials.spontacts.api.authToken
      }))
    }

    // Initialize Playwright platforms
    if (this.credentials.meetup?.playwright) {
      this.platforms.set('meetup-playwright', new MeetupPlaywright(
        { headless: true },
        {
          loginEmail: this.credentials.meetup.playwright.email,
          loginPassword: this.credentials.meetup.playwright.password,
          groupUrl: this.credentials.meetup.playwright.groupUrl,
          defaultDuration: 120
        }
      ))
    }

    if (this.credentials.eventbrite?.playwright) {
      this.platforms.set('eventbrite-playwright', new EventbritePlaywright(
        { headless: true },
        {
          loginEmail: this.credentials.eventbrite.playwright.email,
          loginPassword: this.credentials.eventbrite.playwright.password,
          organizationId: this.credentials.eventbrite.playwright.organizationId,
          defaultTicketType: 'free'
        }
      ))
    }

    if (this.credentials.facebook?.playwright) {
      this.platforms.set('facebook-playwright', new FacebookPlaywright(
        { headless: true },
        {
          loginEmail: this.credentials.facebook.playwright.email,
          loginPassword: this.credentials.facebook.playwright.password,
          pageId: this.credentials.facebook.playwright.pageId,
          businessManagerUrl: this.credentials.facebook.playwright.businessManagerUrl
        }
      ))
    }

    if (this.credentials.spontacts?.playwright) {
      this.platforms.set('spontacts-playwright', new SpontactsPlaywright(
        { headless: true },
        {
          loginEmail: this.credentials.spontacts.playwright.email,
          loginPassword: this.credentials.spontacts.playwright.password,
          profileUrl: this.credentials.spontacts.playwright.profileUrl,
          defaultCity: this.credentials.spontacts.playwright.defaultCity,
          defaultParticipantLimit: 50
        }
      ))
    }
  }

  async publishToMultiplePlatforms(
    eventData: Event,
    platforms: Array<{ platform: SupportedPlatform; method: IntegrationMethod }>
  ): Promise<Array<{
    platform: SupportedPlatform
    method: IntegrationMethod
    result: PlatformResult
  }>> {
    const results = []

    for (const { platform, method } of platforms) {
      const platformKey = `${platform}-${method}`
      const platformInstance = this.platforms.get(platformKey)

      if (!platformInstance) {
        results.push({
          platform,
          method,
          result: {
            success: false,
            error: `Platform ${platform} with method ${method} not configured`
          }
        })
        continue
      }

      try {
        const result = await platformInstance.createEvent(eventData)
        results.push({
          platform,
          method,
          result
        })
      } catch (error) {
        results.push({
          platform,
          method,
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    return results
  }

  async verifyPublications(
    verifications: Array<{
      platform: SupportedPlatform
      method: IntegrationMethod
      eventId: string
    }>
  ): Promise<Array<{
    platform: SupportedPlatform
    method: IntegrationMethod
    verification: VerificationResult
  }>> {
    const results = []

    for (const { platform, method, eventId } of verifications) {
      const platformKey = `${platform}-${method}`
      const platformInstance = this.platforms.get(platformKey)

      if (!platformInstance) {
        results.push({
          platform,
          method,
          verification: {
            verified: false,
            error: `Platform ${platform} with method ${method} not configured`
          }
        })
        continue
      }

      try {
        const verification = await platformInstance.verifyEvent(eventId)
        results.push({
          platform,
          method,
          verification
        })
      } catch (error) {
        results.push({
          platform,
          method,
          verification: {
            verified: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    return results
  }

  getPlatformInstance(platform: SupportedPlatform, method: IntegrationMethod): PlatformInterface | undefined {
    return this.platforms.get(`${platform}-${method}`)
  }

  getAvailablePlatforms(): Array<{ platform: SupportedPlatform; method: IntegrationMethod }> {
    const available = []
    
    for (const [key] of this.platforms) {
      const [platform, method] = key.split('-')
      available.push({
        platform: platform as SupportedPlatform,
        method: method as IntegrationMethod
      })
    }
    
    return available
  }

  updateCredentials(credentials: PlatformCredentials) {
    this.credentials = credentials
    this.platforms.clear()
    this.initializePlatforms()
  }
}