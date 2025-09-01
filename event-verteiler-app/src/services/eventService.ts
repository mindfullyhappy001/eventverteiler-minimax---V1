import { supabase } from '@/lib/supabase'
import type { Event } from '@/lib/supabase'

export interface EventFilters {
  kategorie?: string
  event_typ?: string
  datum_from?: string
  datum_to?: string
}

export class EventService {
  static async createEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      const { data, error } = await supabase.functions.invoke('events-crud', {
        body: {
          action: 'create',
          data: eventData
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }

  static async getEvents(filters?: EventFilters): Promise<Event[]> {
    try {
      const { data, error } = await supabase.functions.invoke('events-crud', {
        body: {
          action: 'read',
          filters: filters || {}
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }

  static async getSingleEvent(eventId: string): Promise<Event> {
    try {
      const { data, error } = await supabase.functions.invoke('events-crud', {
        body: {
          action: 'get_single',
          eventId
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error fetching event:', error)
      throw error
    }
  }

  static async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    try {
      const { data, error } = await supabase.functions.invoke('events-crud', {
        body: {
          action: 'update',
          eventId,
          data: eventData
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('events-crud', {
        body: {
          action: 'delete',
          eventId
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }
}