import type { Event } from '@/lib/supabase'

export interface MeetupAPIConfig {
  accessToken: string
  groupId: string
  oauth: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
}

export interface MeetupEventData {
  name: string
  description: string
  time: number // Unix timestamp
  duration?: number // in milliseconds
  venue_id?: string
  how_to_find_us?: string
  guest_limit?: number
  featured_photo_id?: string
}

export class MeetupAPI {
  private config: MeetupAPIConfig
  private baseUrl = 'https://api.meetup.com'

  constructor(config: MeetupAPIConfig) {
    this.config = config
  }

  async createEvent(eventData: Event): Promise<{
    success: boolean
    platformEventId?: string
    error?: string
  }> {
    try {
      const meetupEventData = this.transformEventData(eventData)
      
      const response = await fetch(`${this.baseUrl}/${this.config.groupId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetupEventData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Meetup API Error: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        platformEventId: result.id
      }
    } catch (error) {
      console.error('Meetup API createEvent error:', error)
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
      const response = await fetch(`${this.baseUrl}/${this.config.groupId}/events/${eventId}`, {
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
      const meetupEventData = this.transformEventData(eventData)
      
      const response = await fetch(`${this.baseUrl}/${this.config.groupId}/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetupEventData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Meetup API Error: ${response.status} - ${errorData}`)
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
      const response = await fetch(`${this.baseUrl}/${this.config.groupId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Meetup API Error: ${response.status} - ${errorData}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private transformEventData(eventData: Event): MeetupEventData {
    const eventDateTime = new Date(`${eventData.datum}T${eventData.uhrzeit}`)
    
    return {
      name: eventData.titel,
      description: this.formatDescription(eventData),
      time: eventDateTime.getTime(),
      duration: 2 * 60 * 60 * 1000, // Default 2 hours
      guest_limit: eventData.event_typ === 'virtual' ? 1000 : 100,
      how_to_find_us: eventData.ort || undefined
    }
  }

  private formatDescription(eventData: Event): string {
    let description = eventData.beschreibung || ''
    
    if (eventData.veranstalter) {
      description += `\n\nVeranstalter: ${eventData.veranstalter}`
    }
    
    if (eventData.preis) {
      description += `\n\nPreis: ${eventData.preis}`
    }
    
    if (eventData.tags.length > 0) {
      description += `\n\nTags: ${eventData.tags.join(', ')}`
    }
    
    if (eventData.url) {
      description += `\n\nWeitere Informationen: ${eventData.url}`
    }
    
    return description
  }
}