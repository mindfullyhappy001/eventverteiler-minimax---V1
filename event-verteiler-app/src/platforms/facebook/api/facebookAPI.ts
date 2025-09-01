import type { Event } from '@/lib/supabase'

export interface FacebookAPIConfig {
  accessToken: string
  pageId: string
  appId: string
  appSecret: string
  oauth: {
    redirectUri: string
  }
}

export interface FacebookEventData {
  name: string
  description?: string
  start_time: string
  end_time?: string
  place?: {
    name: string
    location?: {
      city?: string
      country?: string
      latitude?: number
      longitude?: number
      street?: string
      zip?: string
    }
  }
  privacy_type?: 'OPEN' | 'CLOSED' | 'SECRET'
  category?: 'ARTS_AND_ENTERTAINMENT' | 'BUSINESS' | 'COMMUNITY' | 'EDUCATION' | 'FAMILY_AND_EDUCATION' | 'FITNESS_AND_WELLNESS' | 'FOOD_AND_DRINK' | 'GOVERNMENT_AND_POLITICS' | 'HEALTH_AND_MEDICAL' | 'MUSIC' | 'NIGHTLIFE' | 'OTHER' | 'PARTY_OR_SOCIAL_GATHERING' | 'RELIGION_AND_SPIRITUALITY' | 'SHOPPING_AND_RETAIL' | 'SPORTS' | 'THEATER' | 'TRAVEL_AND_OUTDOOR'
  online_event_format?: 'messenger_room' | 'third_party' | 'other'
  online_event_third_party_url?: string
}

export class FacebookAPI {
  private config: FacebookAPIConfig
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(config: FacebookAPIConfig) {
    this.config = config
  }

  async createEvent(eventData: Event): Promise<{
    success: boolean
    platformEventId?: string
    error?: string
  }> {
    try {
      const facebookEventData = this.transformEventData(eventData)
      
      const response = await fetch(`${this.baseUrl}/${this.config.pageId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(facebookEventData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Facebook API Error: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        platformEventId: result.id
      }
    } catch (error) {
      console.error('Facebook API createEvent error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async verifyEvent(eventId: string): Promise<{
    verified: boolean
    eventData?: any
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${eventId}?fields=id,name,description,start_time,attending_count,interested_count`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!response.ok) {
        return {
          verified: false,
          error: `Event not found or API error: ${response.status}`
        }
      }

      const eventData = await response.json()
      
      return {
        verified: true,
        eventData
      }
    } catch (error) {
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateEvent(eventId: string, eventData: Event): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const facebookEventData = this.transformEventData(eventData)
      
      const response = await fetch(`${this.baseUrl}/${eventId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(facebookEventData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Facebook API Error: ${response.status} - ${errorData}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async deleteEvent(eventId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Facebook API Error: ${response.status} - ${errorData}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private transformEventData(eventData: Event): FacebookEventData {
    const startDateTime = new Date(`${eventData.datum}T${eventData.uhrzeit}`)
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000) // Add 2 hours
    
    const facebookEvent: FacebookEventData = {
      name: eventData.titel,
      description: this.formatDescription(eventData),
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      privacy_type: 'OPEN'
    }

    // Add location for physical events
    if (eventData.event_typ !== 'virtual' && eventData.ort) {
      facebookEvent.place = {
        name: eventData.ort
      }
    }

    // Handle virtual events
    if (eventData.event_typ === 'virtual') {
      facebookEvent.online_event_format = 'third_party'
      if (eventData.url) {
        facebookEvent.online_event_third_party_url = eventData.url
      }
    }

    // Map category based on tags
    facebookEvent.category = this.mapCategoryFromTags(eventData.tags, eventData.kategorie)

    return facebookEvent
  }

  private formatDescription(eventData: Event): string {
    let description = eventData.beschreibung || ''
    
    if (eventData.veranstalter) {
      description += `\n\nVeranstalter: ${eventData.veranstalter}`
    }
    
    if (eventData.preis) {
      description += `\nPreis: ${eventData.preis}`
    }
    
    if (eventData.tags.length > 0) {
      description += `\nTags: ${eventData.tags.join(', ')}`
    }
    
    return description
  }

  private mapCategoryFromTags(tags: string[], category?: string): FacebookEventData['category'] {
    const lowerTags = tags.map(t => t.toLowerCase())
    const lowerCategory = category?.toLowerCase()
    
    if (lowerTags.includes('music') || lowerTags.includes('musik') || lowerCategory === 'musik') {
      return 'MUSIC'
    }
    
    if (lowerTags.includes('business') || lowerTags.includes('geschäft') || lowerCategory === 'business') {
      return 'BUSINESS'
    }
    
    if (lowerTags.includes('tech') || lowerTags.includes('technology') || lowerCategory === 'technologie') {
      return 'EDUCATION'
    }
    
    if (lowerTags.includes('sport') || lowerTags.includes('fitness') || lowerCategory === 'sport') {
      return 'SPORTS'
    }
    
    if (lowerTags.includes('food') || lowerTags.includes('essen') || lowerCategory === 'essen') {
      return 'FOOD_AND_DRINK'
    }
    
    return 'OTHER'
  }
}