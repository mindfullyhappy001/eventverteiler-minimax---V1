import React, { useState, useEffect } from 'react'
import { useEvents } from '@/contexts/EventContext'
import type { Event } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  RefreshCw, 
  Settings,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { getStatusColor, formatDateTime, formatDate } from '@/lib/utils'

interface PublishingDashboardProps {
  event: Event
  onBack?: () => void
}

interface PlatformStatus {
  platform: string
  method: 'api' | 'playwright'
  status: 'idle' | 'pending' | 'success' | 'failed' | 'verified'
  platformEventId?: string
  error?: string
  screenshotUrl?: string
  publishedAt?: string
  isEnabled: boolean
}

const AVAILABLE_PLATFORMS = [
  {
    id: 'meetup',
    name: 'Meetup',
    icon: '🤝',
    description: 'Networking und Community Events',
    supportedMethods: ['api', 'playwright']
  },
  {
    id: 'eventbrite',
    name: 'Eventbrite',
    icon: '🎟️',
    description: 'Ticket-Management und Event-Promotion',
    supportedMethods: ['api', 'playwright']
  },
  {
    id: 'facebook',
    name: 'Facebook Events',
    icon: '📘',
    description: 'Social Media Event-Promotion',
    supportedMethods: ['api', 'playwright']
  },
  {
    id: 'spontacts',
    name: 'Spontacts',
    icon: '⚡',
    description: 'Spontane Aktivitäten und Events',
    supportedMethods: ['api', 'playwright']
  }
]

export function PublishingDashboard({ event, onBack }: PublishingDashboardProps) {
  const { publishEvent, verifyPublications, getPublicationStatus } = useEvents()
  const [platformStates, setPlatformStates] = useState<PlatformStatus[]>(() => 
    AVAILABLE_PLATFORMS.flatMap(platform => 
      platform.supportedMethods.map(method => ({
        platform: platform.id,
        method: method as 'api' | 'playwright',
        status: 'idle' as const,
        isEnabled: true
      }))
    )
  )
  const [isPublishing, setIsPublishing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  const [publishMethod, setPublishMethod] = useState<'api' | 'playwright'>('api')

  // Load existing publication status
  useEffect(() => {
    loadPublicationStatus()
  }, [event.id])

  const loadPublicationStatus = async () => {
    try {
      const statusData = await getPublicationStatus(event.id)
      
      if (statusData.logs && statusData.logs.length > 0) {
        setPlatformStates(prev => 
          prev.map(state => {
            const log = statusData.logs.find((l: any) => 
              l.platform === state.platform && l.method === state.method
            )
            
            if (log) {
              return {
                ...state,
                status: log.status,
                platformEventId: log.platform_event_id,
                publishedAt: log.published_at,
                error: log.error_details?.message
              }
            }
            
            return state
          })
        )
      }
    } catch (error) {
      console.error('Error loading publication status:', error)
    }
  }

  const handlePlatformToggle = (platformId: string) => {
    const newSelected = new Set(selectedPlatforms)
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId)
    } else {
      newSelected.add(platformId)
    }
    setSelectedPlatforms(newSelected)
  }

  const handlePublish = async () => {
    if (selectedPlatforms.size === 0) {
      alert('Bitte wählen Sie mindestens eine Plattform aus.')
      return
    }

    setIsPublishing(true)
    
    try {
      // Update status for selected platforms
      setPlatformStates(prev => 
        prev.map(state => 
          selectedPlatforms.has(state.platform) && state.method === publishMethod
            ? { ...state, status: 'pending', error: undefined }
            : state
        )
      )

      const result = await publishEvent(
        event.id,
        Array.from(selectedPlatforms),
        publishMethod
      )

      // Update platform states with results
      if (result.publishResults) {
        setPlatformStates(prev => 
          prev.map(state => {
            const publishResult = result.publishResults.find((r: any) => 
              r.platform === state.platform && r.method === publishMethod
            )
            
            if (publishResult) {
              return {
                ...state,
                status: publishResult.status,
                platformEventId: publishResult.platformEventId,
                error: publishResult.error,
                screenshotUrl: publishResult.screenshotUrl
              }
            }
            
            return state
          })
        )
      }

    } catch (error) {
      console.error('Error publishing event:', error)
      
      // Mark selected platforms as failed
      setPlatformStates(prev => 
        prev.map(state => 
          selectedPlatforms.has(state.platform) && state.method === publishMethod
            ? { 
                ...state, 
                status: 'failed', 
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : state
        )
      )
    } finally {
      setIsPublishing(false)
    }
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    
    try {
      const result = await verifyPublications(event.id)
      
      if (result.verificationResults) {
        setPlatformStates(prev => 
          prev.map(state => {
            const verificationResult = result.verificationResults.find((r: any) => 
              r.platform === state.platform && r.method === state.method
            )
            
            if (verificationResult?.verification) {
              return {
                ...state,
                status: verificationResult.verification.verified ? 'verified' : 'failed',
                error: verificationResult.verification.error
              }
            }
            
            return state
          })
        )
      }
    } catch (error) {
      console.error('Error verifying publications:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Veröffentlichung läuft...'
      case 'success': return 'Veröffentlicht'
      case 'failed': return 'Fehler'
      case 'verified': return 'Verifiziert'
      default: return 'Nicht veröffentlicht'
    }
  }

  const publishedCount = platformStates.filter(p => p.status === 'success' || p.status === 'verified').length
  const failedCount = platformStates.filter(p => p.status === 'failed').length
  const pendingCount = platformStates.filter(p => p.status === 'pending').length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              ← Zurück
            </Button>
            
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Event veröffentlichen</h2>
              <p className="text-muted-foreground">{event.titel}</p>
            </div>
          </div>
          
          {(event.datum || event.uhrzeit) && (
            <p className="text-sm text-muted-foreground mt-2">
              {event.datum ? formatDate(event.datum) : ''} {event.uhrzeit || ''}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Publikationsstatus</div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-green-600 font-medium">{publishedCount} veröffentlicht</span>
            {failedCount > 0 && (
              <span className="text-red-600 font-medium">{failedCount} Fehler</span>
            )}
            {pendingCount > 0 && (
              <span className="text-yellow-600 font-medium">{pendingCount} ausstehend</span>
            )}
          </div>
        </div>
      </div>

      {/* Publishing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Event veröffentlichen
          </CardTitle>
          <CardDescription>
            Wählen Sie die Plattformen aus, auf denen Sie Ihr Event veröffentlichen möchten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Veröffentlichungsart</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="publishMethod"
                  value="api"
                  checked={publishMethod === 'api'}
                  onChange={(e) => setPublishMethod(e.target.value as 'api')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">API-Integration</div>
                  <div className="text-sm text-muted-foreground">
                    Schnell und zuverlässig via API
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="publishMethod"
                  value="playwright"
                  checked={publishMethod === 'playwright'}
                  onChange={(e) => setPublishMethod(e.target.value as 'playwright')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">UI-Automation</div>
                  <div className="text-sm text-muted-foreground">
                    Browser-basierte Automatisierung
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Plattformen auswählen</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {AVAILABLE_PLATFORMS.map((platform) => {
                const platformState = platformStates.find(p => 
                  p.platform === platform.id && p.method === publishMethod
                )
                
                return (
                  <label 
                    key={platform.id}
                    className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPlatforms.has(platform.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.has(platform.id)}
                        onChange={() => handlePlatformToggle(platform.id)}
                        className="mr-2"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{platform.icon}</span>
                        <span className="font-medium">{platform.name}</span>
                      </div>
                      {platformState && getStatusIcon(platformState.status)}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      {platform.description}
                    </div>
                    
                    {platformState && platformState.status !== 'idle' && (
                      <div className="mt-2">
                        <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(platformState.status)}`}>
                          {getStatusLabel(platformState.status)}
                        </div>
                        
                        {platformState.error && (
                          <div className="text-xs text-red-600 mt-1">
                            {platformState.error}
                          </div>
                        )}
                        
                        {platformState.platformEventId && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {platformState.platformEventId}
                          </div>
                        )}
                      </div>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedPlatforms.size} Plattform{selectedPlatforms.size !== 1 ? 'en' : ''} ausgewählt
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={isVerifying || publishedCount === 0}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Verifizieren
                  </>
                )}
              </Button>
              
              <Button
                onClick={handlePublish}
                disabled={isPublishing || selectedPlatforms.size === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPublishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Veröffentlichung läuft...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Veröffentlichen
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publication Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Publikationsübersicht
          </CardTitle>
          <CardDescription>
            Detaillierte Übersicht aller Publikationsversuche
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {AVAILABLE_PLATFORMS.map((platform) => {
              const apiState = platformStates.find(p => p.platform === platform.id && p.method === 'api')
              const playwrightState = platformStates.find(p => p.platform === platform.id && p.method === 'playwright')
              
              return (
                <div key={platform.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{platform.icon}</span>
                    <h4 className="font-medium">{platform.name}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">API</span>
                        {apiState && getStatusIcon(apiState.status)}
                      </div>
                      
                      <div className="text-sm text-right">
                        {apiState && (
                          <>
                            <div className={`px-2 py-1 rounded text-xs ${getStatusColor(apiState.status)}`}>
                              {getStatusLabel(apiState.status)}
                            </div>
                            {apiState.platformEventId && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {apiState.platformEventId}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Playwright Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">UI-Automation</span>
                        {playwrightState && getStatusIcon(playwrightState.status)}
                      </div>
                      
                      <div className="text-sm text-right">
                        {playwrightState && (
                          <>
                            <div className={`px-2 py-1 rounded text-xs ${getStatusColor(playwrightState.status)}`}>
                              {getStatusLabel(playwrightState.status)}
                            </div>
                            {playwrightState.screenshotUrl && (
                              <button className="text-xs text-blue-600 hover:underline mt-1">
                                <ExternalLink className="inline h-3 w-3 mr-1" />
                                Screenshot
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Errors */}
                  {(apiState?.error || playwrightState?.error) && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center gap-1 text-red-800 text-sm font-medium mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        Fehlerdetails
                      </div>
                      {apiState?.error && (
                        <div className="text-xs text-red-700 mb-1">
                          <strong>API:</strong> {apiState.error}
                        </div>
                      )}
                      {playwrightState?.error && (
                        <div className="text-xs text-red-700">
                          <strong>UI-Automation:</strong> {playwrightState.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}