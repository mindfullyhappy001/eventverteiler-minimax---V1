import React, { useState } from 'react'
import { useEvents } from '@/contexts/EventContext'
import type { Event } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Calendar, MapPin, Tag, User, ExternalLink } from 'lucide-react'
import { formatDate, formatTime, getEventTypeColor, truncateText } from '@/lib/utils'

interface EventListProps {
  onEventSelect?: (event: Event) => void
  onCreateNew?: () => void
}

export function EventList({ onEventSelect, onCreateNew }: EventListProps) {
  const { events, loading, error, filters, setFilters } = useEvents()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.titel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.beschreibung?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.ort?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Erneut versuchen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events</h2>
          <p className="text-muted-foreground">
            {filteredEvents.length} von {events.length} Events
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Neues Event
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Events durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Erweiterte Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kategorie</label>
                <select 
                  value={filters.kategorie || ''}
                  onChange={(e) => setFilters({...filters, kategorie: e.target.value || undefined})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Alle Kategorien</option>
                  <option value="Technologie">Technologie</option>
                  <option value="Business">Business</option>
                  <option value="Kunst">Kunst</option>
                  <option value="Sport">Sport</option>
                  <option value="Musik">Musik</option>
                  <option value="Bildung">Bildung</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Event-Typ</label>
                <select 
                  value={filters.event_typ || ''}
                  onChange={(e) => setFilters({...filters, event_typ: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Alle Typen</option>
                  <option value="live">Live</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Datum ab</label>
                <Input
                  type="date"
                  value={filters.datum_from || ''}
                  onChange={(e) => setFilters({...filters, datum_from: e.target.value || undefined})}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => setFilters({})}
                className="text-sm"
              >
                Filter zurücksetzen
              </Button>
              
              <div className="text-sm text-muted-foreground">
                {filteredEvents.length} Events gefunden
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine Events gefunden</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || Object.keys(filters).length > 0 
              ? 'Versuchen Sie andere Suchkriterien oder Filter.'
              : 'Erstellen Sie Ihr erstes Event, um loszulegen.'
            }
          </p>
          <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Event erstellen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onClick={() => onEventSelect?.(event)} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg line-clamp-2">{event.titel}</CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_typ)}`}>
            {event.event_typ}
          </span>
        </div>
        
        {event.beschreibung && (
          <CardDescription className="line-clamp-2">
            {truncateText(event.beschreibung, 120)}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 text-sm text-muted-foreground">
          {/* Datum und Zeit */}
          {(event.datum || event.uhrzeit) && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {event.datum && formatDate(event.datum)}
                {event.datum && event.uhrzeit && ' um '}
                {event.uhrzeit && formatTime(event.uhrzeit)}
              </span>
            </div>
          )}
          
          {/* Ort */}
          {event.ort && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.ort}</span>
            </div>
          )}
          
          {/* Kategorie */}
          {event.kategorie && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>{event.kategorie}</span>
            </div>
          )}
          
          {/* Veranstalter */}
          {event.veranstalter && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">{event.veranstalter}</span>
            </div>
          )}
          
          {/* URL */}
          {event.url && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span className="text-blue-600 hover:underline truncate">Link</span>
            </div>
          )}
          
          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {event.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Preis */}
          {event.preis && (
            <div className="mt-3 pt-3 border-t">
              <span className="font-medium text-foreground">{event.preis}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}