-- Migration: create_platform_configs_table
-- Created at: 1756757218

-- Platform-Konfigurationstabelle für sichere Speicherung von API-Keys und Anmeldedaten
CREATE TABLE platform_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(platform)
);

-- RLS (Row Level Security) aktivieren
ALTER TABLE platform_configs ENABLE ROW LEVEL SECURITY;

-- Policy für authentifizierte Benutzer (falls Auth implementiert)
-- Aktuell: Vollzugriff für alle (wird später angepasst)
CREATE POLICY "Allow all operations for now" 
ON platform_configs 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- Index für bessere Performance
CREATE INDEX idx_platform_configs_platform ON platform_configs(platform);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_configs_updated_at 
BEFORE UPDATE ON platform_configs 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();;