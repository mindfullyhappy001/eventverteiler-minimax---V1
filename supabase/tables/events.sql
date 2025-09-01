CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titel TEXT NOT NULL,
    beschreibung TEXT,
    datum DATE,
    uhrzeit TIME,
    ort TEXT,
    kategorie TEXT,
    tags TEXT[],
    preis TEXT,
    event_typ TEXT CHECK (event_typ IN ('virtual',
    'live',
    'hybrid')),
    bilder_urls TEXT[],
    veranstalter TEXT,
    url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);