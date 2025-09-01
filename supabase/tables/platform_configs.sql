CREATE TABLE platform_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_name TEXT NOT NULL,
    config_type TEXT CHECK (config_type IN ('api',
    'playwright')),
    api_credentials JSONB,
    playwright_settings JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);