# Event-Verteiler App

Eine umfassende Event-Management-Plattform, die Events zentral verwaltet und diese automatisch auf verschiedene Event-Plattformen per API und UI-Automation veröffentlicht.

## 🎨 Features

### 📊 **Vollständiges Event-Management**
- **CRUD-Operationen** für Events mit allen wichtigen Feldern
- **Erweiterte Filterung** und Suche
- **Event-Kategorisierung** und Tags
- **Responsive Design** für Desktop und Mobile

### 🚀 **Multi-Plattform Publishing**
- **4 integrierte Plattformen**: Meetup, Eventbrite, Facebook Events, Spontacts
- **Duale Integration**: API + Playwright UI-Automation pro Plattform
- **Modulare Architektur** mit strikter Plattform-Trennung
- **Verifikationssystem** für alle Veröffentlichungen

### 📄 **CSV-Tools**
- **Bulk-Import** von Events via CSV
- **Export** aller Event-Daten
- **Validierung** vor dem Import
- **Template-Download** für einfache Nutzung

### 📊 **Dashboard & Analytics**
- **Übersichtsdashboard** mit Statistiken
- **Publikationsstatus** in Echtzeit
- **Logs & Fehlerbehandlung**
- **Session-Management** für Playwright

## 🏷️ **Technische Architektur**

### **Frontend**
- **React 18** + **TypeScript**
- **TailwindCSS** für Styling
- **Lucide React** Icons
- **Responsive Design**

### **Backend (Supabase)**
- **PostgreSQL** Datenbank
- **4 Edge Functions** für Backend-Logik
- **Storage** für Screenshots und Dateien
- **Real-time** Updates

### **Plattform-Integration**
```
src/platforms/
├── meetup/
│   ├── api/meetupAPI.ts
│   └── playwright/meetupPlaywright.ts
├── eventbrite/
│   ├── api/eventbriteAPI.ts
│   └── playwright/eventbritePlaywright.ts
├── facebook/
│   ├── api/facebookAPI.ts
│   └── playwright/facebookPlaywright.ts
└── spontacts/
    ├── api/spontactsAPI.ts
    └── playwright/spontactsPlaywright.ts
```

## 🗺️ **Datenbank-Schema**

### **events** - Event-Haupttabelle
```sql
id UUID PRIMARY KEY
titel TEXT NOT NULL
beschreibung TEXT
datum DATE
uhrzeit TIME
ort TEXT
kategorie TEXT
tags TEXT[]
preis TEXT
event_typ TEXT CHECK (event_typ IN ('virtual', 'live', 'hybrid'))
bilder_urls TEXT[]
veranstalter TEXT
url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### **publishing_logs** - Publikationsprotokolle
```sql
id UUID PRIMARY KEY
event_id UUID REFERENCES events(id)
platform TEXT NOT NULL
method TEXT CHECK (method IN ('api', 'playwright'))
status TEXT CHECK (status IN ('pending', 'success', 'failed', 'verified'))
platform_event_id TEXT
error_details JSONB
screenshot_url TEXT
published_at TIMESTAMP
```

## 🚀 **Getting Started**

### **Installation**
```bash
# Repository klonen
git clone <repository-url>
cd event-verteiler-app

# Dependencies installieren
pnpm install

# Development Server starten
pnpm dev
```

### **Umgebungsvariablen**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Supabase Setup**
1. **Datenbank**: Tabellen sind bereits erstellt
2. **Edge Functions**: Bereits deployed und funktionsbereit
3. **Storage**: Buckets für Screenshots werden automatisch erstellt

## 🎨 **Design-System**

### **Farbpalette**
- **Primär**: Blau/Türkis (#2563eb)
- **Sekundär**: Grautöne (#64748b)
- **Status-Farben**:
  - ✅ Erfolg: Grün (#10b981)
  - ⚠️ Warnung: Gelb (#f59e0b)
  - ❌ Fehler: Rot (#ef4444)

### **UI-Komponenten**
- **Clean Design** mit viel Weißraum
- **Konsistente Icons** (Lucide React)
- **Status-Indikatoren** für alle Aktionen
- **Mobile-responsive** Layout

## 📁 **Projekt-Struktur**

```
src/
├── components/           # React-Komponenten
│   ├── dashboard/        # Dashboard-Komponenten
│   ├── events/           # Event-Management
│   ├── publishing/       # Publishing-Dashboard
│   ├── csv/             # CSV-Tools
│   └── ui/              # Basis-UI-Komponenten
├── contexts/             # React Contexts
├── services/             # API-Services
├── platforms/            # Plattform-Integrationen
├── lib/                  # Utilities
└── types/                # TypeScript-Typen
```

## 🤖 **Plattform-Features**

### **Meetup Integration**
- **API**: OAuth 2.0, Event-Erstellung, Mitgliederverwaltung
- **Playwright**: Login-Automation, Form-Ausfüllung, Screenshot-Verifikation

### **Eventbrite Integration**  
- **API**: Ticket-Setup, Venue-Management, Real-time-Status
- **Playwright**: Multi-Step-Creation, Image-Upload, Session-Management

### **Facebook Events**
- **API**: Graph API, Page-Events, Privacy-Settings
- **Playwright**: Business Manager, 2FA-Handling, Anti-Bot-Detection

### **Spontacts Integration**
- **API**: Deutsche API-Integration (falls verfügbar)
- **Playwright**: Deutsche UI-Navigation, Teilnehmer-Limits, Mobile-Support

## 📊 **Monitoring & Logs**

### **Publishing-Status**
- **Pending**: Veröffentlichung läuft
- **Success**: Erfolgreich veröffentlicht
- **Failed**: Fehler aufgetreten
- **Verified**: Verifikation erfolgreich

### **Error-Handling**
- **Detaillierte Fehlermeldungen**
- **Screenshot-Dokumentation** (Playwright)
- **Retry-Mechanismen**
- **Session-Wiederherstellung**

## 🛠️ **Deployment**

### **Frontend (Vercel/Netlify)**
```bash
pnpm build
# Upload dist/ Ordner
```

### **Backend (Supabase)**
- **Edge Functions**: Bereits deployed
- **Datenbank**: Produktionsbereit
- **Storage**: Automatische Konfiguration

## 📜 **API-Referenz**

### **Event CRUD**
```typescript
// Event erstellen
POST /functions/v1/events-crud
{ action: 'create', data: EventData }

// Events laden
POST /functions/v1/events-crud
{ action: 'read', filters: {} }

// Event aktualisieren
POST /functions/v1/events-crud
{ action: 'update', eventId: string, data: EventData }
```

### **Publishing**
```typescript
// Event veröffentlichen
POST /functions/v1/platform-publish
{ eventId: string, platforms: string[], publishType: 'api'|'playwright' }

// Veröffentlichung verifizieren
POST /functions/v1/platform-verify
{ action: 'verify_event', eventId: string }
```

## 🎆 **Features in Entwicklung**

- **Analytics-Dashboard** mit detaillierten Berichten
- **Erweiterte Plattform-Konfiguration**
- **Bulk-Publishing** für mehrere Events
- **E-Mail-Benachrichtigungen**
- **API-Rate-Limiting** und Optimierung
- **Dark Mode** Support

## 📞 **Support**

Für Fragen und Support wenden Sie sich an:
- **GitHub Issues**: Für Bug-Reports und Feature-Requests
- **Documentation**: Detaillierte API-Dokumentation
- **Community**: Discord/Slack für Diskussionen

---

**Event-Verteiler App** - Zentrale Event-Verwaltung für alle wichtigen Plattformen 🎉