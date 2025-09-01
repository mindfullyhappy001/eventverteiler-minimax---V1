import type { Event } from '@/lib/supabase'

export interface EventbriteAPIConfig {
  accessToken: string
  organizationId: string
  oauth: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
}

export interface EventbriteEventData {
  name: {
    html: string
  }
  description: {
    html: string
  }
  start: {
    timezone: string
    utc: string
  }
  end: {
    timezone: string
    utc: string
  }
  currency: string
  online_event?: boolean
  listed?: boolean
  shareable?: boolean
  invite_only?: boolean
  show_remaining?: boolean
  capacity?: number
  is_free?: boolean
}

export class EventbriteAPI {
  private config: EventbriteAPIConfig
  private baseUrl = 'https://www.eventbriteapi.com/v3'
  private timezone = 'Europe/Berlin'

  constructor(config: EventbriteAPIConfig) {
    this.config = config
  }

  async createEvent(eventData: Event): Promise<{
    success: boolean
    platformEventId?: string
    error?: string
  }> {
    try {
      const eventbriteEventData = this.transformEventData(eventData)
      
      const response = await fetch(`${this.baseUrl}/events/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventbriteEventData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Eventbrite API Error: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      
      // Publish the event if it's not free
      if (!eventbriteEventData.is_free) {
        await this.publishEvent(result.id)
      }
      
      return {
        success: true,
        platformEventId: result.id
      }
    } catch (error) {
      console.error('Eventbrite API createEvent error:', error)
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
      const response = await fetch(`${this.baseUrl}/events/${eventId}/`, {
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
      const eventbriteEventData = this.transformEventData(eventData)
      
      const response = await fetch(`${this.baseUrl}/events/${eventId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventbriteEventData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Eventbrite API Error: ${response.status} - ${errorData}`)
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
      const response = await fetch(`${this.baseUrl}/events/${eventId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Eventbrite API Error: ${response.status} - ${errorData}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async publishEvent(eventId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}/publish/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Eventbrite publish error: ${response.status} - ${errorData}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private transformEventData(eventData: Event): EventbriteEventData {
    const startDateTime = new Date(`${eventData.datum}T${eventData.uhrzeit}`)
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000) // Add 2 hours
    
    const isFree = !eventData.preis || eventData.preis.toLowerCase().includes('kostenlos') || eventData.preis.toLowerCase().includes('free')
    
    return {
      name: {
        html: eventData.titel
      },
      description: {
        html: this.formatDescription(eventData)
      },
      start: {
        timezone: this.timezone,
        utc: startDateTime.toISOString()
      },
      end: {
        timezone: this.timezone,
        utc: endDateTime.toISOString()
      },
      currency: 'EUR',
      online_event: eventData.event_typ === 'virtual',
      listed: true,
      shareable: true,
      invite_only: false,
      show_remaining: true,
      capacity: eventData.event_typ === 'virtual' ? 1000 : 200,
      is_free: isFree
    }
  }

  private formatDescription(eventData: Event): string {
    let html = `<p>${eventData.beschreibung || ''}</p>`
    
    if (eventData.ort) {
      html += `<p><strong>Ort:</strong> ${eventData.ort}</p>`
    }
    
    if (eventData.veranstalter) {
      html += `<p><strong>Veranstalter:</strong> ${eventData.veranstalter}</p>`
    }
    
    if (eventData.preis) {
      html += `<p><strong>Preis:</strong> ${eventData.preis}</p>`
    }
    
    if (eventData.tags.length > 0) {
      html += `<p><strong>Tags:</strong> ${eventData.tags.join(', ')}</p>`
    }
    
    if (eventData.url) {
      html += `<p><strong>Weitere Informationen:</strong> <a href="${eventData.url}" target="_blank">${eventData.url}</a></p>`
    }
    
    return html
  }
}