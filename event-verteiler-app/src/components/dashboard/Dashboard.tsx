import React, { useState } from 'react'
import { useEvents } from '@/contexts/EventContext'
import type { Event } from '@/lib/supabase'
import { EventList } from '@/components/events/EventList'
import { EventForm } from '@/components/events/EventForm'
import { PublishingDashboard } from '@/components/publishing/PublishingDashboard'
import { CSVManager } from '@/components/csv/CSVManager'
import { PlatformConfigurationManager } from '@/components/platforms/PlatformConfigurationManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  Send, 
  FileSpreadsheet, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Settings
} from 'lucide-react'

type DashboardView = 'overview' | 'events' | 'create-event' | 'edit-event' | 'publishing' | 'csv' | 'analytics' | 'platform-config'

interface DashboardState {
  view: DashboardView
  selectedEvent: Event | null
}

export function Dashboard() {
  const { events, loading, error } = useEvents()
  const [state, setState] = useState<DashboardState>({
    view: 'overview',
    selectedEvent: null
  })

  const setView = (view: DashboardView, event: Event | null = null) => {
    setState({ view, selectedEvent: event })
  }

  // Calculate statistics
  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => {
      if (!e.datum) return false
      return new Date(e.datum) >= new Date()
    }).length,
    publishedEvents: events.filter(e => {
      // This would need actual publication data
      return false
    }).length,
    recentEvents: events.filter(e => {
      const createdDate = new Date(e.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return createdDate >= weekAgo
    }).length
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fehler beim Laden</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Seite neu laden
          </Button>
        </div>
      </div>
    )
  }

  // Render current view
  const renderCurrentView = () => {
    switch (state.view) {
      case 'events':
        return (
          <EventList
            onEventSelect={(event) => setView('edit-event', event)}
            onCreateNew={() => setView('create-event')}
          />
        )
      
      case 'create-event':
        return (
          <EventForm
            onSave={(event) => {
              setView('events')
            }}
            onCancel={() => setView('events')}
          />
        )
      
      case 'edit-event':
        return (
          <EventForm
            event={state.selectedEvent}
            onSave={(event) => {
              setState(prev => ({ ...prev, selectedEvent: event }))
              setView('events')
            }}
            onCancel={() => setView('events')}
          />
        )
      
      case 'publishing':
        return state.selectedEvent ? (
          <PublishingDashboard
            event={state.selectedEvent}
            onBack={() => setView('events')}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Kein Event ausgewählt</p>
            <Button onClick={() => setView('events')} className="mt-4">
              Zurück zu Events
            </Button>
          </div>
        )
      
      case 'csv':
        return <CSVManager onClose={() => setView('overview')} />
      
      case 'analytics':
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Analytics</h2>
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics verfügbar</h3>
              <p className="text-muted-foreground">Detaillierte Berichte werden bald verfügbar sein.</p>
            </div>
          </div>
        )
        
      case 'platform-config':
        return <PlatformConfigurationManager />
      
      default:
        return renderOverview()
    }
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Event-Verteiler Dashboard
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Verwalten und verteilen Sie Ihre Events zentral auf alle wichtigen Plattformen
        </p>
        
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => setView('create-event')}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Neues Event erstellen
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setView('events')}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Alle Events anzeigen
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Gesamt Events"
          value={stats.totalEvents}
          icon={<Calendar className="h-6 w-6" />}
          color="blue"
        />
        
        <StatCard
          title="Kommende Events"
          value={stats.upcomingEvents}
          icon={<Clock className="h-6 w-6" />}
          color="green"
        />
        
        <StatCard
          title="Veröffentlicht"
          value={stats.publishedEvents}
          icon={<CheckCircle className="h-6 w-6" />}
          color="purple"
        />
        
        <StatCard
          title="Diese Woche erstellt"
          value={stats.recentEvents}
          icon={<Plus className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
          <CardDescription>
            Häufig verwendete Funktionen für effizientes Event-Management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionCard
              title="Event erstellen"
              description="Neues Event mit allen Details anlegen"
              icon={<Plus className="h-8 w-8" />}
              onClick={() => setView('create-event')}
              color="blue"
            />
            
            <QuickActionCard
              title="CSV Import/Export"
              description="Events importieren oder exportieren"
              icon={<FileSpreadsheet className="h-8 w-8" />}
              onClick={() => setView('csv')}
              color="green"
            />
            
            <QuickActionCard
              title="Plattform-Konfiguration"
              description="API-Keys und Automatisierung verwalten"
              icon={<Settings className="h-8 w-8" />}
              onClick={() => setView('platform-config')}
              color="purple"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Neueste Events</CardTitle>
                <CardDescription>
                  Ihre zuletzt erstellten Events
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setView('events')}>
                Alle anzeigen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setView('edit-event', event)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{event.titel}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {event.datum && (
                        <span>{new Date(event.datum).toLocaleDateString('de-DE')}</span>
                      )}
                      {event.ort && <span>{event.ort}</span>}
                      {event.kategorie && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {event.kategorie}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setView('publishing', event)
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Plattform-Status</CardTitle>
          <CardDescription>
            Übersicht der verfügbaren Event-Plattformen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Meetup', status: 'Konfiguriert', icon: '🤝', color: 'green' },
              { name: 'Eventbrite', status: 'Konfiguriert', icon: '🎟️', color: 'green' },
              { name: 'Facebook Events', status: 'Konfiguriert', icon: '📘', color: 'green' },
              { name: 'Spontacts', status: 'Konfiguriert', icon: '⚡', color: 'green' }
            ].map((platform) => (
              <div key={platform.name} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{platform.icon}</span>
                  <h4 className="font-medium">{platform.name}</h4>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                  platform.color === 'green' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {platform.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  Event-Verteiler
                </h1>
              </div>
              
              <div className="hidden md:flex space-x-4">
                <NavButton 
                  active={state.view === 'overview'}
                  onClick={() => setView('overview')}
                >
                  Übersicht
                </NavButton>
                
                <NavButton 
                  active={state.view === 'events' || state.view === 'create-event' || state.view === 'edit-event'}
                  onClick={() => setView('events')}
                >
                  Events
                </NavButton>
                
                <NavButton 
                  active={state.view === 'publishing'}
                  onClick={() => {
                    if (events.length > 0) {
                      setView('publishing', events[0])
                    } else {
                      setView('events')
                    }
                  }}
                >
                  Publishing
                </NavButton>
                
                <NavButton 
                  active={state.view === 'csv'}
                  onClick={() => setView('csv')}
                >
                  CSV-Tools
                </NavButton>
                
                <NavButton 
                  active={state.view === 'analytics'}
                  onClick={() => setView('analytics')}
                >
                  Analytics
                </NavButton>
                
                <NavButton 
                  active={state.view === 'platform-config'}
                  onClick={() => setView('platform-config')}
                >
                  Plattform-Config
                </NavButton>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderCurrentView()}
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, color }: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-md ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({ title, description, icon, onClick, color }: {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  color: 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
    green: 'text-green-600 bg-green-100 hover:bg-green-200',
    purple: 'text-purple-600 bg-purple-100 hover:bg-purple-200'
  }

  return (
    <div 
      className="p-6 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className={`p-3 rounded-md w-fit mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function NavButton({ active, onClick, children }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}