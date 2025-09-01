CREATE TABLE publishing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    platform TEXT NOT NULL,
    method TEXT CHECK (method IN ('api',
    'playwright')),
    status TEXT CHECK (status IN ('pending',
    'success',
    'failed',
    'verified')),
    platform_event_id TEXT,
    error_details JSONB,
    screenshot_url TEXT,
    published_at TIMESTAMP DEFAULT NOW()
);