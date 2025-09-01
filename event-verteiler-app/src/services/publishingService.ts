import { supabase } from '@/lib/supabase'

export interface PublishRequest {
  eventId: string
  platforms: string[]
  publishType: 'api' | 'playwright'
}

export interface PublishResult {
  platform: string
  method: 'api' | 'playwright'
  status: 'success' | 'failed' | 'pending'
  platformEventId?: string
  error?: string
  logId?: string
}

export interface PublishSummary {
  total: number
  successful: number
  failed: number
  pending: number
}

export class PublishingService {
  static async publishEvent(request: PublishRequest): Promise<{
    eventId: string
    publishResults: PublishResult[]
    summary: PublishSummary
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('platform-publish', {
        body: {
          eventId: request.eventId,
          platforms: request.platforms,
          publishType: request.publishType
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error publishing event:', error)
      throw error
    }
  }

  static async verifyPublications(logIds: string[]): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('platform-verify', {
        body: {
          action: 'verify_batch',
          logIds
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error verifying publications:', error)
      throw error
    }
  }

  static async verifyEventPublications(eventId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('platform-verify', {
        body: {
          action: 'verify_event',
          eventId
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error verifying event publications:', error)
      throw error
    }
  }

  static async getPublicationStatus(eventId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('platform-verify', {
        body: {
          action: 'get_status',
          eventId
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error getting publication status:', error)
      throw error
    }
  }
}