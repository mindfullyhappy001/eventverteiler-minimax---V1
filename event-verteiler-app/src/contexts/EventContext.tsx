import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Event } from '@/lib/supabase'
import { EventService, type EventFilters } from '@/services/eventService'
import { PublishingService } from '@/services/publishingService'
import { CSVService } from '@/services/csvService'

interface EventContextType {
  // Events
  events: Event[]
  loading: boolean
  error: string | null
  
  // CRUD Operations
  createEvent: (eventData: Partial<Event>) => Promise<Event>
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<Event>
  deleteEvent: (eventId: string) => Promise<void>
  getEvent: (eventId: string) => Promise<Event>
  loadEvents: (filters?: EventFilters) => Promise<void>
  
  // Publishing
  publishEvent: (eventId: string, platforms: string[], method: 'api' | 'playwright') => Promise<any>
  verifyPublications: (eventId: string) => Promise<any>
  getPublicationStatus: (eventId: string) => Promise<any>
  
  // CSV Operations
  exportEventsToCSV: () => Promise<void>
  importEventsFromCSV: (csvData: string) => Promise<any>
  getCSVTemplate: () => Promise<void>
  validateCSV: (csvData: string) => Promise<any>
  
  // Filters
  filters: EventFilters
  setFilters: (filters: EventFilters) => void
  clearFilters: () => void
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<EventFilters>({})

  // Load events on mount and when filters change
  useEffect(() => {
    loadEvents(filters)
  }, [filters])

  const loadEvents = async (eventFilters?: EventFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const loadedEvents = await EventService.getEvents(eventFilters)
      setEvents(loadedEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Events')
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
    try {
      const newEvent = await EventService.createEvent(eventData)
      setEvents(prev => [newEvent, ...prev])
      return newEvent
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Erstellen des Events'
      setError(errorMsg)
      throw err
    }
  }

  const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
    try {
      const updatedEvent = await EventService.updateEvent(eventId, eventData)
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ))
      return updatedEvent
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Events'
      setError(errorMsg)
      throw err
    }
  }

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      await EventService.deleteEvent(eventId)
      setEvents(prev => prev.filter(event => event.id !== eventId))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Löschen des Events'
      setError(errorMsg)
      throw err
    }
  }

  const getEvent = async (eventId: string): Promise<Event> => {
    try {
      return await EventService.getSingleEvent(eventId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Laden des Events'
      setError(errorMsg)
      throw err
    }
  }

  const publishEvent = async (eventId: string, platforms: string[], method: 'api' | 'playwright') => {
    try {
      return await PublishingService.publishEvent({
        eventId,
        platforms,
        publishType: method
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Veröffentlichen des Events'
      setError(errorMsg)
      throw err
    }
  }

  const verifyPublications = async (eventId: string) => {
    try {
      return await PublishingService.verifyEventPublications(eventId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler bei der Verifikation'
      setError(errorMsg)
      throw err
    }
  }

  const getPublicationStatus = async (eventId: string) => {
    try {
      return await PublishingService.getPublicationStatus(eventId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Laden des Publikationsstatus'
      setError(errorMsg)
      throw err
    }
  }

  const exportEventsToCSV = async () => {
    try {
      const result = await CSVService.exportEvents()
      CSVService.downloadCSV(result.csvContent, result.filename)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim CSV-Export'
      setError(errorMsg)
      throw err
    }
  }

  const importEventsFromCSV = async (csvData: string) => {
    try {
      const result = await CSVService.importEvents(csvData)
      // Reload events after import
      await loadEvents(filters)
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim CSV-Import'
      setError(errorMsg)
      throw err
    }
  }

  const getCSVTemplate = async () => {
    try {
      const result = await CSVService.getTemplate()
      CSVService.downloadCSV(result.csvTemplate, result.filename)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler beim Laden der CSV-Vorlage'
      setError(errorMsg)
      throw err
    }
  }

  const validateCSV = async (csvData: string) => {
    try {
      return await CSVService.validateCSV(csvData)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fehler bei der CSV-Validierung'
      setError(errorMsg)
      throw err
    }
  }

  const clearFilters = () => {
    setFilters({})
  }

  return (
    <EventContext.Provider value={{
      events,
      loading,
      error,
      createEvent,
      updateEvent,
      deleteEvent,
      getEvent,
      loadEvents,
      publishEvent,
      verifyPublications,
      getPublicationStatus,
      exportEventsToCSV,
      importEventsFromCSV,
      getCSVTemplate,
      validateCSV,
      filters,
      setFilters,
      clearFilters
    }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvents() {
  const context = useContext(EventContext)
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider')
  }
  return context
}