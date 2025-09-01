# Meetup API v3 - Vollständige Technische Analyse

## Executive Summary

Die Meetup API durchlief im Februar 2025 eine fundamentale Transformation von REST zu einer vollwertigen GraphQL-Architektur. Diese umfassende Analyse zeigt, dass die neue API v3 erhebliche Verbesserungen in der Entwicklerfreundlichkeit, Performance und Funktionalität bietet, jedoch eine vollständige Migration bestehender Anwendungen erfordert. Die wichtigsten Erkenntnisse umfassen: vollständige Schema-Introspektion, ausschließlich OAuth 2.0-Authentifizierung, erweiterte Event-Management-Funktionen und strikte Rate Limits von 500 Punkten pro 60 Sekunden.

## 1. Einführung

Diese Analyse untersucht die aktuelle Meetup API v3 Dokumentation mit dem Ziel, Entwicklern eine vollständige Referenz für die Integration der neuen GraphQL-basierten API zu bieten. Die Forschung konzentrierte sich auf sieben kritische Bereiche: Authentifizierung, Event-Management, technische Spezifikationen und die bedeutsamen Änderungen von 2025.

## 2. Revolutionäre Änderungen 2025

### 2.1 GraphQL-Migration (Februar 2025)

Im Februar 2025 veröffentlichte Meetup eine komplett überarbeitete API-Version, die von REST zu GraphQL wechselte[1]. Diese Transformation brachte fundamentale Verbesserungen:

**Kernverbesserungen:**
- **Vollständige Schema-Introspektion**: Entwickler können jetzt das komplette API-Schema mit jedem GraphQL-Tool erkunden[1]
- **Single-Endpoint-Architektur**: Alle API-Aufrufe erfolgen über `https://api.meetup.com/gql-ext`[1]
- **Optimierte Datenübertragung**: Durch spezifische Feldauswahl wird der Netzwerkverkehr minimiert[4]
- **Kombinierte Abfragen**: Mehrere GraphQL-Queries können in einer einzigen Anfrage kombiniert werden[4]

### 2.2 Umfassende API-Feldmappings

Die Migration erfordert eine vollständige Überarbeitung bestehender Integrations aufgrund umbenannter Datenfelder[1]:

**Allgemeine Änderungen:**
- `Ticket` → `RSVP`
- `User` → `Member`  
- `GroupMembership` → `Membership`
- `Image` → `Photo`
- `keywordSearch` → Aufgeteilt in `groupSearch` und `eventSearch`
- `count` → `totalCount`

**Event-spezifische Änderungen:**
- `image/images` → `featuredEventPhoto`
- `isOnline` → `eventType` (unterstützt jetzt `online`, `inPerson`, `hybrid`)
- `going, waiting, tickets` → `rsvps` (mit angewandten Filtern)

**Member-Änderungen:**
- `tickets` → `rsvps`
- `hostedEvents, upcomingEvents, draftEvents` → `memberEvents` (mit Filtern)

Diese umfassenden Änderungen machen eine vollständige Code-Überarbeitung unvermeidlich, bieten jedoch deutlich mehr Flexibilität und Klarheit[1].

## 3. Authentifizierungsverfahren (OAuth 2.0)

### 3.1 Ausschließlich OAuth 2.0

Die Meetup API v3 unterstützt ausschließlich OAuth 2.0-Authentifizierung über HTTPS[2]. **Wichtig**: API-Key-basierte Authentifizierung ist vollständig deprecated und wird nicht mehr unterstützt.

### 3.2 Unterstützte OAuth 2.0 Flows

**1. Server Flow (Authorization Code Grant)** - *Empfohlen für Webanwendungen*[2]
```
Autorisierungs-URL: https://secure.meetup.com/oauth2/authorize?client_id={CLIENT_KEY}&response_type=code&redirect_uri={REDIRECT_URI}
Token-Endpoint: https://secure.meetup.com/oauth2/access
```

**Erforderliche Parameter:**
- `client_id`: Ihre Client-Kennung
- `client_secret`: Client-Geheimnis
- `grant_type`: "authorization_code"
- `redirect_uri`: Registrierte Redirect-URI
- `code`: Autorisierungscode vom ersten Schritt

**2. Refresh Token Flow** - *Für Token-Erneuerung*[2]
Ermöglicht die Erneuerung abgelaufener Access-Tokens. **Wichtig**: Refresh Tokens sind nur für einmalige Verwendung bestimmt[2].

**3. JWT Flow** - *Server-zu-Server ohne Benutzerinteraktion*[2]
Für automatisierte Systeme, beschränkt auf OAuth-Client-Besitzer. Erfordert RSA-Schlüsselsignierung:

```json
JWT-Header: {
    "kid": "{SIGNING_KEY_ID}",
    "typ": "JWT", 
    "alg": "RS256"
}

JWT-Claims: {
    "sub": "{AUTHORIZED_MEMBER_ID}",
    "iss": "{CLIENT_KEY}",
    "aud": "api.meetup.com",
    "exp": "{EXPIRATION_TIME}"
}
```

**4. Implicit Flow** - *JavaScript-basierte Browser-Clients*[2]
Für clientseitige Anwendungen, Token werden als URL-Fragment zurückgegeben.

### 3.3 Token-Lebensdauer und -Management

- **Access Token**: 3600 Sekunden (1 Stunde)[2]
- **Autorisierungs-Header**: `Authorization: Bearer {ACCESS_TOKEN}`[1]
- **Token-Validierung**: Über `query { self { id name } }`[1]

## 4. Event Creation und Management Endpoints

### 4.1 GraphQL Mutations für Events

Die neue API bietet drei Haupt-Mutations für Event-Management[3]:

**`createEvent`** - Event-Erstellung
- **Input**: `CreateEventInput` (erforderlich)
- **Response**: `CreateEventPayload`

**`editEvent`** - Event-Bearbeitung  
- **Input**: `EditEventInput` (erforderlich)
- **Response**: `EditEventPayload`

**`deleteEvent`** - Event-Löschung
- **Input**: `DeleteEventInput` (erforderlich)
- **Response**: `DeleteEventPayload`

### 4.2 CreateEventInput - Erforderliche Parameter

**Pflichtfelder:**
- `groupUrlname` (String): URL-Name der Gruppe
- `title` (String): Event-Titel (1-80 Zeichen)
- `description` (String): HTML-Beschreibung (max. 50.000 Zeichen)
- `startDateTime` (DateTime): Startzeit ohne Zeitzonendaten (z.B. "2022-03-01T05:30")

### 4.3 CreateEventInput - Optionale Parameter

**Timing und Dauer:**
- `duration` (Duration): ISO 8601 Format
- `rsvpSettings` (RsvpSettings): RSVP-Öffnungs-/Schließzeiten

**Veranstaltungsort:**
- `venueId` (String): Numerische Kennung oder "online" für Online-Events
- `venueIds` ([String]): Für Hybrid-Events (mehrere Locations)
- `venueOptions` ([VenueOptionInput]): Separate Optionen für Hybrid-Events
- `location` (PointLocation): Angepasste Koordinaten

**Organisationsdetails:**
- `eventHosts` ([Int]): Liste der Mitglieder-IDs als Veranstalter
- `selfRsvp` (Boolean): Auto-RSVP für Creator (Standard: true)
- `howToFindUs` (String): Standortbeschreibung/Event-URL für Online-Events

**Erweiterte Funktionen:**
- `question` (String): RSVP-Umfragefrage (max. 250 Zeichen)
- `feeOption` (EventFeeOption): Kostenpflichtige Events
- `recurring` (RecurringEvents): Wiederkehrende Terminplanung
- `publishStatus` (PublishStatus): PUBLISHED oder DRAFT
- `topics` ([ID]): Themen-IDs
- `covidPrecautions` (CovidPrecautionsInput): COVID-19-Sicherheitsmaßnahmen

### 4.4 EditEventInput - Update-Operationen

Der `editEvent`-Mutation ermöglicht die Bearbeitung bestehender Events[3]:

**Erforderlich:**
- `eventId` (ID): Kennung des zu bearbeitenden Events

**Anpassbare Felder:**
- Alle CreateEventInput-Felder (außer `groupUrlname`)
- `applyToSeries` (Boolean): Änderungen auf Event-Serie anwenden

### 4.5 Praktische Implementierung

**Beispiel curl-Aufruf für Event-Erstellung**[6]:
```bash
curl -X POST https://api.meetup.com/gql-ext \
  -H 'Authorization: Bearer {YOUR_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation($input: CreateEventInput!) { createEvent(input: $input) { event { id title dateTime } errors { message } } }",
    "variables": {
      "input": {
        "groupUrlname": "your-group",
        "title": "Neues Event",
        "description": "Event-Beschreibung hier",
        "startDateTime": "2025-04-01T19:00:00"
      }
    }
  }'
```

## 5. Rate Limits und Performance

### 5.1 Aktuelle Rate Limits

Die Meetup API v3 implementiert ein punktbasiertes Rate-Limiting-System[1]:

- **Limit**: 500 Punkte pro 60 Sekunden
- **Zeitfenster**: Rollierendes 60-Sekunden-Fenster
- **Enforcement**: Strikt, keine Ausnahmen

### 5.2 Rate Limit Überschreitung

Bei Überschreitung werden detaillierte Fehlerinformationen zurückgegeben[1]:

```json
{
  "errors": [{
    "message": "Too many requests, please try again shortly.",
    "locations": [{"line": 2, "column": 3}],
    "path": ["event"],
    "extensions": {
      "code": "RATE_LIMITED",
      "consumedPoints": "[verbrauchte Punkte]",
      "resetAt": "2021-12-12T18:37:51.644Z"
    }
  }],
  "data": null
}
```

### 5.3 Best Practices für Rate Limiting

**Empfohlene Strategien:**
- Implementierung exponentieller Backoff-Algorithmen
- Pausen zwischen Anfragen basierend auf verbrauchten Punkten
- Überwachung des `resetAt`-Timestamps für optimale Wiederholung
- Batch-Operationen wo möglich zur Punkteoptimierung

## 6. Fehlerbehandlung und Response Codes

### 6.1 GraphQL-spezifische Fehlerbehandlung

Die neue API nutzt GraphQL-Standard-Fehlerstrukturen statt HTTP-Status-Codes für API-spezifische Fehler[1]:

**Fehlerstruktur:**
```json
{
  "errors": [{
    "message": "Beschreibende Fehlermeldung",
    "locations": [{"line": X, "column": Y}],
    "path": ["feldPfad"],
    "extensions": {
      "code": "ERROR_CODE",
      "zusätzliche": "Metadaten"
    }
  }],
  "data": null
}
```

### 6.2 Wichtige Fehlercodes

**`RATE_LIMITED`**: Zu viele Anfragen[1]
- Bedeutung: Rate Limit überschritten
- Action: Warten bis `resetAt` erreicht ist
- Header: Enthält `consumedPoints` und `resetAt`

**OAuth-Fehler**[2]:
- `invalid_request`: Fehlende oder fehlerhafte Parameter
- `unauthorized_client`: Client nicht autorisiert
- `access_denied`: Benutzer verweigerte Zugriff
- `invalid_grant`: Ungültiger Autorisierungscode
- `invalid_client`: Client-Authentifizierung fehlgeschlagen

### 6.3 HTTP-Status-Codes

Grundlegende HTTP-Fehler bleiben relevant:
- `400 Bad Request`: Syntaxfehler in GraphQL-Query
- `401 Unauthorized`: Fehlende oder ungültige Authentifizierung
- `403 Forbidden`: Unzureichende Berechtigung
- `429 Too Many Requests`: Rate Limit überschritten (backup)
- `500 Internal Server Error`: Server-seitige Probleme

## 7. API-Key vs OAuth Requirements

### 7.1 Ende der API-Key-Ära

**Kritische Änderung**: Die Meetup API unterstützt seit 2025 **keine API-Key-Authentifizierung mehr**. Alle Anwendungen müssen auf OAuth 2.0 migrieren.

**Historischer Kontext:**
- API-Key-Authentifizierung war in früheren REST-API-Versionen verfügbar
- GitHub-Issue #20[8] dokumentierte diese Deprecation ohne Vorankündigung im August
- Entwickler berichteten über "majorly broke" Funktionalität nach dem Wechsel

### 7.2 OAuth 2.0 Vorteile

**Sicherheitsverbesserungen:**
- **Token-basierte Sicherheit**: Kurzlebige Access Tokens (1 Stunde)
- **Scope-basierte Autorisierung**: Granulare Berechtigungskontrolle
- **Refresh-Mechanismus**: Sichere Token-Erneuerung
- **Benutzerinteraktion**: Explizite Einverständniserklärung

**Entwicklervorteile:**
- **Standardisiert**: Branchenstandard OAuth 2.0 Implementierung
- **Flexible Flows**: Vier verschiedene Authentifizierungsflows für verschiedene Anwendungstypen
- **Bessere UX**: Benutzer-kontobasierte Autorisierung

## 8. Praktische Implementierungsbeispiele

### 8.1 MCP Server Integration

Ein herausragendes Beispiel für moderne Meetup API Integration ist der Model Communication Protocol (MCP) Server von Dan Shields[7]. Dieser produktionsreife Server demonstriert:

**Kernfunktionen:**
- **Event Discovery Engine**: Natürliche Sprachverarbeitung für Event-Suchen
- **OAuth2 Authentication Manager**: Vollständige Token-Lebenszyklus-Verwaltung  
- **Claude LLM Integration**: KI-gestützte Event-Empfehlungen
- **Multi-Tool Support**: Vier verschiedene MCP-Tools für verschiedene Anwendungsfälle

**Verfügbare Tools:**
1. `search_meetup_events`: Ereignissuche mit natürlicher Sprache
2. `augment_prompt_with_events`: Prompt-Erweiterung mit Event-Kontext
3. `get_event_recommendations`: AI-gestützte Empfehlungen
4. `get_oauth_url`: OAuth-Setup-Unterstützung

### 8.2 GraphQL-Abfrage-Beispiele

**Einfache Event-Abfrage**[6]:
```graphql
query($eventId: ID) {
  event(id: $eventId) {
    title
    description
    dateTime
    featuredEventPhoto {
      baseUrl
    }
    rsvps(first: 10) {
      edges {
        node {
          member {
            name
          }
          response
        }
      }
    }
  }
}
```

**Event-Erstellung mit vollständigen Optionen**:
```graphql
mutation($input: CreateEventInput!) {
  createEvent(input: $input) {
    event {
      id
      title
      dateTime
      publishStatus
    }
    errors {
      message
      field
    }
  }
}
```

## 9. Migration und Empfehlungen

### 9.1 Migrationsstrategie

**Sofortige Maßnahmen:**
1. **API-URL aktualisieren**: Von REST-Endpoints auf `https://api.meetup.com/gql-ext`
2. **Authentifizierung umstellen**: Von API-Keys auf OAuth 2.0
3. **Feldmappings anwenden**: Alle deprecated Feldnamen auf neue GraphQL-Felder migrieren
4. **Query-Validierung**: GraphQL-Tools für Schema-Validierung einsetzen

### 9.2 Entwicklungsempfehlungen

**Best Practices:**
- **Schema Introspection nutzen**: Verwenden Sie GraphQL-Tools zur Erkundung der vollständigen API
- **Batch-Operationen**: Kombinieren Sie mehrere Abfragen zur Optimierung der Rate Limits
- **Error Handling**: Implementieren Sie robuste Fehlerbehandlung für alle OAuth- und GraphQL-Fehler
- **Token-Management**: Automatische Refresh-Token-Verwaltung implementieren

**Ressourcen:**
- GraphQL Playground: `/api/playground/#graphQl-playground`[5]
- Support-Portal: Community Support über help.meetup.com[5]
- Beispiel-Implementierungen: GitHub-Repositories wie mcp-meetup[7]

## 10. Fazit

Die Meetup API v3 stellt eine signifikante Modernisierung dar, die Entwicklern deutlich mehr Flexibilität und Leistung bietet. Die Migration zu GraphQL und OAuth 2.0 erfordert zwar eine vollständige Überarbeitung bestehender Integrations, bringt jedoch langfristige Vorteile in Sicherheit, Performance und Entwicklerfreundlichkeit.

**Zentrale Erkenntnisse:**
- **Umfassende Modernisierung**: Februar 2025 brachte fundamentale API-Architektur-Änderungen
- **GraphQL-First**: Single-Endpoint mit vollständiger Schema-Introspection
- **OAuth-only**: API-Key-Authentifizierung vollständig deprecated
- **Erweiterte Event-Management**: Umfassende CRUD-Operationen mit detaillierten Parametern
- **Strikte Rate Limits**: 500 Punkte/60 Sekunden mit detailliertem Monitoring

Die neue API bietet eine solide Grundlage für moderne, skalierbare Meetup-Integrationen und sollte von allen Entwicklern als strategische Verbesserung betrachtet werden.

## Quellen

[1] [API Doc Guide - Meetup API Migration 2025](https://www.meetup.com/api/guide/) - High Reliability - Offizielle Meetup.com API-Dokumentation mit kompletten Migration-Details

[2] [API Doc Authentication - OAuth 2.0 Flows](https://www.meetup.com/api/authentication/) - High Reliability - Offizielle OAuth 2.0 Implementierungsdetails von Meetup.com

[3] [API Docs Schema - GraphQL Mutations](https://www.meetup.com/api/schema/) - High Reliability - Vollständige GraphQL Schema-Dokumentation von Meetup.com

[4] [API Doc Introduction - GraphQL Fundamentals](https://www.meetup.com/api/general) - High Reliability - Offizielle GraphQL-Einführung und technische Spezifikationen

[5] [API Doc Support - Hilferessourcen](https://www.meetup.com/api/support/) - High Reliability - Offizielle Support-Kanäle und Ressourcen von Meetup.com

[6] [Bash Script - GraphQL API curl Example](https://gist.github.com/sjwaight/ec28fc08da1f7d2ff3a4abdbfdeab5e0) - Medium Reliability - Praktisches Implementierungsbeispiel von erfahrenem Entwickler

[7] [MCP Meetup Server - Claude Integration](https://github.com/d4nshields/mcp-meetup) - Medium Reliability - Produktionsreifer Open-Source-Server für Meetup API Integration
