import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkxsiwscwqtjtuorqumc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreHNpd3Njd3F0anR1b3JxdW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTI5MDcsImV4cCI6MjA3MjMyODkwN30.0XkwiL84LsTpB0Z4ACpGWoGR7ptVLiktGOlQHuGTVMk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Event {
  id: string
  titel: string
  beschreibung?: string
  datum?: string
  uhrzeit?: string
  ort?: string
  kategorie?: string
  tags: string[]
  preis?: string
  event_typ: 'virtual' | 'live' | 'hybrid'
  bilder_urls: string[]
  veranstalter?: string
  url?: string
  created_at: string
  updated_at: string
}

export interface PlatformConfig {
  id: string
  platform_name: string
  config_type: 'api' | 'playwright'
  api_credentials?: any
  playwright_settings?: any
  is_active: boolean
  created_at: string
}

export interface PublishingLog {
  id: string
  event_id: string
  platform: string
  method: 'api' | 'playwright'
  status: 'pending' | 'success' | 'failed' | 'verified'
  platform_event_id?: string
  error_details?: any
  screenshot_url?: string
  published_at: string
}

export interface PlatformSession {
  id: string
  platform: string
  cookies?: any
  local_storage?: any
  session_token?: string
  expires_at?: string
  is_active: boolean
  created_at: string
}