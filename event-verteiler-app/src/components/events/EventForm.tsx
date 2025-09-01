import React, { useState, useEffect } from 'react'
import { useEvents } from '@/contexts/EventContext'
import type { Event } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, ArrowLeft, X, Plus } from 'lucide-react'

interface EventFormProps {
  event?: Event | null
  onSave?: (event: Event) => void
  onCancel?: () => void
}

const initialEventData = {
  titel: '',
  beschreibung: '',
  datum: '',
  uhrzeit: '',
  ort: '',
  kategorie: '',
  tags: [] as string[],
  preis: '',
  event_typ: 'live' as 'virtual' | 'live' | 'hybrid',
  bilder_urls: [] as string[],
  veranstalter: '',
  url: ''
}

export function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const { createEvent, updateEvent, loading } = useEvents()
  const [formData, setFormData] = useState(initialEventData)
  const [tagInput, setTagInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  
  const isEditing = !!event

  useEffect(() => {
    if (event) {
      setFormData({
        titel: event.titel || '',
        beschreibung: event.beschreibung || '',
        datum: event.datum || '',
        uhrzeit: event.uhrzeit || '',
        ort: event.ort || '',
        kategorie: event.kategorie || '',
        tags: event.tags || [],
        preis: event.preis || '',
        event_typ: event.event_typ || 'live',
        bilder_urls: event.bilder_urls || [],
        veranstalter: event.veranstalter || '',
        url: event.url || ''
      })
      if (event.url) {
        setUrlInput(event.url)
      }
    }
  }, [event])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addUrl = () => {
    if (urlInput.trim() && !formData.bilder_urls.includes(urlInput.trim())) {
      setFormData(prev => ({
        ...prev,
        bilder_urls: [...prev.bilder_urls, urlInput.trim()]
      }))
      setUrlInput('')
    }
  }

  const removeUrl = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      bilder_urls: prev.bilder_urls.filter(url => url !== urlToRemove)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.titel.trim()) {
      newErrors.titel = 'Titel ist erforderlich'
    }
    
    if (formData.datum && formData.datum < new Date().toISOString().split('T')[0]) {
      newErrors.datum = 'Das Datum kann nicht in der Vergangenheit liegen'
    }
    
    if (formData.url && !isValidUrl(formData.url)) {
      newErrors.url = 'Bitte geben Sie eine gültige URL ein'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    
    try {
      let savedEvent: Event
      
      if (isEditing && event) {
        savedEvent = await updateEvent(event.id, formData)
      } else {
        savedEvent = await createEvent(formData)
      }
      
      onSave?.(savedEvent)
    } catch (error) {
      console.error('Error saving event:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Event bearbeiten' : 'Neues Event erstellen'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? 'Bearbeiten Sie die Event-Details' : 'Füllen Sie die Event-Informationen aus'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Grundinformationen */}
        <Card>
          <CardHeader>
            <CardTitle>Grundinformationen</CardTitle>
            <CardDescription>
              Die wichtigsten Details zu Ihrem Event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Titel *</label>
                <Input
                  value={formData.titel}
                  onChange={(e) => handleInputChange('titel', e.target.value)}
                  placeholder="Event-Titel eingeben..."
                  className={errors.titel ? 'border-red-500' : ''}
                />
                {errors.titel && <p className="text-red-500 text-sm mt-1">{errors.titel}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Beschreibung</label>
                <textarea
                  value={formData.beschreibung}
                  onChange={(e) => handleInputChange('beschreibung', e.target.value)}
                  placeholder="Beschreibung des Events..."
                  rows={4}
                  className="w-full p-3 border rounded-md resize-vertical"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Datum</label>
                <Input
                  type="date"
                  value={formData.datum}
                  onChange={(e) => handleInputChange('datum', e.target.value)}
                  className={errors.datum ? 'border-red-500' : ''}
                />
                {errors.datum && <p className="text-red-500 text-sm mt-1">{errors.datum}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Uhrzeit</label>
                <Input
                  type="time"
                  value={formData.uhrzeit}
                  onChange={(e) => handleInputChange('uhrzeit', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ort</label>
                <Input
                  value={formData.ort}
                  onChange={(e) => handleInputChange('ort', e.target.value)}
                  placeholder="Veranstaltungsort..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Event-Typ</label>
                <select 
                  value={formData.event_typ}
                  onChange={(e) => handleInputChange('event_typ', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="live">Live (Vor Ort)</option>
                  <option value="virtual">Virtual (Online)</option>
                  <option value="hybrid">Hybrid (Live + Online)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zusatzinformationen */}
        <Card>
          <CardHeader>
            <CardTitle>Zusatzinformationen</CardTitle>
            <CardDescription>
              Weitere Details und Kategorisierung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Kategorie</label>
                <select 
                  value={formData.kategorie}
                  onChange={(e) => handleInputChange('kategorie', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Kategorie wählen...</option>
                  <option value="Technologie">Technologie</option>
                  <option value="Business">Business</option>
                  <option value="Kunst">Kunst</option>
                  <option value="Sport">Sport</option>
                  <option value="Musik">Musik</option>
                  <option value="Bildung">Bildung</option>
                  <option value="Gesundheit">Gesundheit</option>
                  <option value="Familie">Familie</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Preis</label>
                <Input
                  value={formData.preis}
                  onChange={(e) => handleInputChange('preis', e.target.value)}
                  placeholder="z.B. Kostenlos, 25 EUR..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Veranstalter</label>
                <Input
                  value={formData.veranstalter}
                  onChange={(e) => handleInputChange('veranstalter', e.target.value)}
                  placeholder="Name des Veranstalters..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Website-URL</label>
              <Input
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://..."
                type="url"
                className={errors.url ? 'border-red-500' : ''}
              />
              {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Fügen Sie relevante Schlüsselwörter hinzu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Tag hinzufügen..."
                  onKeyPress={(e) => handleKeyPress(e, addTag)}
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bild-URLs */}
        <Card>
          <CardHeader>
            <CardTitle>Event-Bilder</CardTitle>
            <CardDescription>
              Fügen Sie URLs zu Event-Bildern hinzu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Bild-URL hinzufügen..."
                  onKeyPress={(e) => handleKeyPress(e, addUrl)}
                  type="url"
                  className="flex-1"
                />
                <Button type="button" onClick={addUrl} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.bilder_urls.length > 0 && (
                <div className="space-y-2">
                  {formData.bilder_urls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate flex-1">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeUrl(url)}
                        className="hover:bg-gray-200 rounded p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          
          <Button 
            type="submit" 
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichern...
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Aktualisieren' : 'Event erstellen'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}