# Eventbrite API v3 - Umfassende technische Analyse

## Executive Summary

Diese umfassende Analyse der Eventbrite API v3 zeigt ein robustes und gut strukturiertes REST-API-System, das OAuth 2.0-Authentifizierung, umfangreiche Event-Management-Funktionen und moderne Webhook-Integration bietet. Die API bietet vollständige CRUD-Operationen für Events, Venues und Ticketing-Systeme und unterstützt sowohl einfache als auch komplexe Event-Szenarien mit erweiterten Features wie Inventory Tiers und Ticket Groups. Mit standardmäßigen Rate Limits von 2.000 Calls pro Stunde und umfassenden Error-Handling-Mechanismen ist die API für professionelle Integrationen ausgelegt[1,2].

## 1. Einleitung

Die Eventbrite API v3 ist eine REST-basierte API, die umfassende Event-Management-Funktionen für Entwickler bereitstellt. Diese Analyse konzentriert sich auf die technischen Aspekte der API-Integration, einschließlich Authentifizierung, Event-Erstellung, Venue-Management, Image-Upload, Webhooks, Rate Limiting und aktuelle Änderungen. Die API verwendet JSON als primäres Datenformat und ist über die Basis-URL `https://www.eventbriteapi.com/v3` zugänglich[2].

## 2. API-Key Authentifizierung und OAuth-Optionen

### 2.1 Authentifizierungsmethoden

Die Eventbrite API v3 verwendet **OAuth 2.0** als primären Authentifizierungsmechanismus mit zwei Hauptansätzen[1]:

**Privater Token (Personal OAuth Token):**
- Direkte Authentifizierung für eigene API-Anfragen
- Abruf über die Eventbrite API Keys-Seite: `https://www.eventbrite.com/platform/api-keys`
- Verwendung im Authorization Header: `Authorization: Bearer MYTOKEN`
- Alternative als Query Parameter: `/v3/users/me/?token=MYTOKEN`

**App-basierte OAuth-Authentifizierung:**
- Für Apps, die im Namen anderer Benutzer agieren
- Erfordert registrierte Anwendung mit App Key und Client Secret
- Zwei OAuth-Flows verfügbar: Server-Side (empfohlen) und Client-Side

### 2.2 OAuth-Flows im Detail

**Server-Side Authorization Flow (Empfohlen):**[3]
1. Benutzerumleitung zur Autorisierungs-URL:
   ```
   https://www.eventbrite.com/oauth/authorize?response_type=code&client_id=YOUR_APP_KEY&redirect_uri=YOUR_URL
   ```
2. Empfang des Authorization Code
3. Token-Tausch via POST-Request:
   ```
   POST https://www.eventbrite.com/oauth/token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=authorization_code&client_id=YOUR_APP_KEY&client_secret=YOUR_SECRET&code=RECEIVED_CODE&redirect_uri=YOUR_URL
   ```

**Client-Side Authorization Flow:**[3]
- Weniger sicher, für JavaScript-Anwendungen
- Direkter Token-Empfang via URL-Fragment
- Format: `response_type=token` anstatt `code`

### 2.3 Sicherheits-Best-Practices

Die API-Dokumentation betont mehrere kritische Sicherheitsaspekte[1]:

- **Server-Side bevorzugen:** Eventbrite empfiehlt dringend Server-Side Authorization
- **Token-Sicherheit:** Private Tokens niemals in clientseitigem Code exponieren
- **Token-Management:** Nicht verwendete API-Keys regelmäßig löschen
- **OAuth vs. Authentifizierung:** Unterscheidung zwischen Identitätsprüfung und Berechtigungsvalidierung

## 3. Event Creation API-Endpunkte

### 3.1 Haupt-Endpunkte für Event-Management

Die API bietet vier primäre Endpunkte für Event-Operationen[4]:

**Event von Grund auf erstellen:**
```http
POST /v3/organizations/{organization_id}/events/
Authorization: Bearer PERSONAL_OAUTH_TOKEN
Content-Type: application/json

{
  "event": {
    "name": {
      "html": "Mein Event",
      "text": "Mein Event"
    },
    "start": {
      "timezone": "America/Los_Angeles",
      "utc": "2024-12-01T02:00:00Z"
    },
    "end": {
      "timezone": "America/Los_Angeles", 
      "utc": "2024-12-01T05:00:00Z"
    },
    "currency": "USD"
  }
}
```

**Event kopieren:**
```http
POST /v3/events/{event_id}/copy/
```

**Event aktualisieren:**
```http
POST /v3/events/{event_id}/
```

**Event veröffentlichen:**
```http
POST /v3/events/{event_id}/publish/
```

### 3.2 Erforderliche und optionale Parameter

**Erforderliche Parameter für Event-Erstellung:**[4]
- `name` (multipart-text): HTML und Text-Format
- `start` (datetime-tz): Zukünftiges Startdatum mit Zeitzone
- `end` (datetime-tz): Enddatum nach Startdatum
- `currency` (string): ISO 4217 Währungscode (z.B. "USD")

**Wichtige optionale Parameter:**[4]
- `summary`: Event-Zusammenfassung (max. 140 Zeichen)
- `online_event`: Boolean für reine Online-Events
- `listed`: Öffentliche Sichtbarkeit auf Eventbrite
- `capacity`: Maximale Teilnehmerzahl
- `password`: Passwort-Schutz für das Event

### 3.3 Ticketklassen-Erstellung

Nach der Event-Erstellung können Ticketklassen hinzugefügt werden[4]:

```http
POST /v3/events/{event_id}/ticket_classes/
Content-Type: application/json

{
  "ticket_class": {
    "name": "VIP",
    "quantity_total": 100,
    "cost": "USD,5000"  // $50.00
  }
}
```

## 4. Venue-Management und Ticket-Settings

### 4.1 Venue Creation und Management

**Venue-Erstellung:**[8]
```http
POST /v3/organizations/{organization_id}/venues/
Authorization: Bearer PERSONAL_OAUTH_TOKEN

{
  "venue": {
    "name": "Mein Veranstaltungsort",
    "capacity": 500,
    "address": {
      "address_1": "123 Main Street",
      "city": "Berlin",
      "region": "BE",
      "postal_code": "10115",
      "country": "DE"
    }
  }
}
```

**Venue-Update:**[8]
```http
POST /v3/venues/{venue_id}/
```

**Venue-Auflistung:**[8]
```http
GET /v3/organizations/{organization_id}/venues/
```

### 4.2 Erweiterte Ticketing-Features

Die API unterstützt ein dreistufiges Ticketing-System[5]:

**Ticket-Typen:**
- **Kostenlos:** `free: true`
- **Bezahlt:** `cost: "USD,2000"` (für $20.00)
- **Spende:** `donation: true`

**Ticket Groups für Rabatte:**[5]
```http
POST /v3/organizations/{organization_id}/ticket_groups/
{
  "name": "Gruppenrabatt",
  "status": "live",
  "event_ticket_ids": {
    "12345": ["14123", "123123"]
  }
}
```

**Inventory Tiers für komplexe Kapazitäten:**[5]
- Mehrstufige Kapazitätskontrolle
- Add-ons, die nicht zur Hauptkapazität zählen
- Gestaffelte Events mit Ebenen-basierter Tickets

### 4.3 Erweiterte Ticket-Konfiguration

**Wichtige Ticket-Parameter:**[5]
- `sales_start` / `sales_end`: Verkaufszeiträume
- `minimum_quantity` / `maximum_quantity`: Kauf-Limits
- `hidden` / `auto_hide`: Sichtbarkeitssteuerung
- `sales_channels`: ["online", "atd"] (at the door)
- `delivery_methods`: ["electronic"]
- `include_fee`: Gebühren in Preis einschließen

## 5. Image-Upload-Verfahren

### 5.1 3-Schritt Upload-Prozess

Die Eventbrite API verwendet einen sicheren 3-Schritt Image-Upload-Prozess[6]:

**Schritt 1: Upload-Anweisungen abrufen**
```http
GET https://www.eventbriteapi.com/v3/media/upload/?type=image-event-logo&token=PERSONAL_OAUTH_TOKEN
```

**Schritt 2: Image zu S3 hochladen**
- HTTP-Multipart-Upload zur bereitgestellten S3-URL
- Parameter-Name: `file`
- Upload-Ziel: S3-Bucket (z.B. eventbrite-uploader-incoming-prod)

**Schritt 3: API über Upload benachrichtigen**
```http
POST https://www.eventbriteapi.com/v3/media/upload/
{
  "upload_token": "RECEIVED_TOKEN",
  "crop_mask": {
    "top_left": {"x": 0, "y": 0},
    "width": 1280,
    "height": 640
  }
}
```

### 5.2 Crop-Mask Anforderungen

- **Verpflichtend:** 2:1 Verhältnis für Event-Logos[6]
- **Beispiel-Dimensionen:** 1280x640 Pixel
- **Zweck:** Konsistente Darstellung in der Eventbrite-UI

### 5.3 Integration in Event-Description

Nach dem Upload kann die `image_id` in Event-Beschreibungen verwendet werden[6]:
```json
{
  "modules": [
    {
      "type": "image",
      "data": {
        "image_id": "UPLOADED_IMAGE_ID"
      }
    }
  ]
}
```

## 6. Webhook-Integration für Status-Updates

### 6.1 Unterstützte Webhook-Objekte und Events

Die Eventbrite API unterstützt Webhooks für sechs Hauptobjekte[7]:

**Event-Objekt:**
- `publish`, `unpublish`, `create`, `update`

**Order-Objekt:**
- `place`, `update`, `refund`

**Attendee-Objekt:**
- `update`, `check_in`, `check_out`

**Organizer-Objekt:**
- `update`

**Ticket Class-Objekt:**
- `create`, `delete`, `update`

**Venue-Objekt:**
- `update`

### 6.2 Webhook-Konfiguration

**Voraussetzungen für Webhooks:**[7]
- Mindestens ein Event
- Eventbrite API User Key
- Registrierte integrierte Anwendung
- Öffentlich zugängliche Website für Webhook-Empfang

**Webhook-Erstellung:**[7]
1. Navigation zu 'Webhooks Add'
2. Event auswählen
3. Ziel-URL eingeben
4. Objekt für Webhook wählen
5. 'Add Webhook' klicken

### 6.3 Webhook-Payload-Struktur

**Standard-Payload-Format:**[7]
```json
{
  "api_url": "https://www.eventbriteapi.com/v3/orders/1234567890/",
  "config": {
    "endpoint_url": "https://myawesomeapp.com/webhook"
  }
}
```

- **Methode:** HTTP POST
- **Content-Type:** application/json
- **Encoding:** UTF-8, gültiges JSON

### 6.4 Error-Handling und Retry-Mechanismus

**Erfolgreiche Webhooks:**[7]
- 2xx HTTP-Status-Codes gelten als Erfolg
- "200 OK" ist der Standard-Erfolgsindikator

**Fehlgeschlagene Webhooks:**[7]
- Nicht-2xx Antwortcodes triggern Retry-Mechanismus
- Automatische Wiederholung alle 10 Minuten
- Maximum 10 zusätzliche Versuche
- Manuelle Wiederversendung über Webhook-Dashboard möglich
- 15-Tage Speicherung der Delivery-Historie

### 6.5 Sicherheitsaspekte

**URL-Sicherheit:**[7]
- Webhooks sollten an private, unveröffentlichte URLs gesendet werden
- Risiko gefälschter Nachrichten bei öffentlichen URLs
- "410 Gone" Antworten führen zu automatischem Webhook-Deregistrierung

## 7. Rate Limiting und Error-Handling

### 7.1 Aktuelle Rate Limits

**Standard Rate Limits (Stand 2025):**[9,10]
- **Standard:** 2.000 Calls pro Stunde
- **Täglich:** 48.000 Calls pro Tag
- **Berechnung:** Pro OAuth-Token

**Neueste Änderungen (Juni 2025):**[10]
- Neue Ratenlimits wurden definiert und sind in der Rate Limits Dokumentation dokumentiert
- Spezifische Details in der offiziellen Rate Limits Dokumentation

### 7.2 HTTP-Status-Codes und Error-Responses

**Error-Response-Format:**[2]
- HTTP-Status im 400-500 Bereich
- JSON-Response mit detaillierten Error-Informationen
- Strukturierte Error-Beschreibungen für Debugging

**Typische Error-Codes:**
- `401 Unauthorized`: Authentifizierungsfehler
- `403 Forbidden`: Berechtigungsfehler
- `404 Not Found`: Ressource nicht gefunden
- `429 Too Many Requests`: Rate Limit überschritten
- `500 Internal Server Error`: Server-seitiger Fehler

### 7.3 Best Practices für Error-Handling

**Retry-Strategien:**
- Exponential Backoff für Rate Limit Errors
- Unterscheidung zwischen temporären und permanenten Fehlern
- Spezifische Behandlung von Authentication-Fehlern

**Monitoring und Debugging:**
- Verwendung des API Explorers für Endpoint-Tests[11]
- Detaillierte Request/Response-Logging
- Header-Analyse für Rate Limit Status

## 8. Aktuelle API-Änderungen und Deprecated Features

### 8.1 Organisationsarchitektur-Migration (2018-2020)

**Hauptänderung:**[12]
- Einführung der neuen Organisationsarchitektur in der ersten Hälfte 2018
- Vollständige Migration aller Benutzer im Jahr 2020
- Übergang von user-basierten zu organization-basierten Endpunkten

**Deprecated Endpoints (seit Juni 2020):**[12]
Umfassende Migration von `/users/{user_id}/` zu `/organizations/{organization_id}/`:

- `GET /v3/users/{user_id}/events/` → `GET /v3/organizations/{organization_id}/events/`
- `POST /v3/events/` → `POST /v3/organizations/{organization_id}/events/`
- `GET /v3/users/{user_id}/venues/` → `GET /v3/organizations/{organization_id}/venues/`
- `POST /v3/venues/` → `POST /v3/organizations/{organization_id}/venues/`

### 8.2 Search API Deprecation

**Wichtige Änderung:**
- Eventbrite v3 Search API wurde am 20. Februar 2020 deaktiviert
- Keine öffentliche Search-API mehr verfügbar (Stand August 2024)
- Events können nur noch über ID, Venue oder Organisation abgerufen werden

### 8.3 Aktuelle API-Updates (2024-2025)

**Juni 2025 Update:**[10]
- Neue Rate Limits definiert
- Details in der aktualisierten Rate Limits Dokumentation

**API-Evolutionsstrategie:**
- Eventbrite benachrichtigt alle API-Konsumenten vor Feature-Änderungen
- Switchable Features werden schrittweise eingeführt
- Umfassende Migrationsleitfäden für deprecated Features

## 9. Technische Implementierungshinweise

### 9.1 API-Basis-Konfiguration

**Grundeinstellungen:**[2]
- **Basis-URL:** `https://www.eventbriteapi.com/v3`
- **Datenformat:** JSON (UTF-8 kodiert)
- **HTTP-Methoden:** GET, POST, DELETE
- **Authentifizierung:** OAuth 2.0 Bearer Token

### 9.2 Expansion-System

**Expansion-Parameter:**[2]
- Reduziert Anzahl der API-Calls
- Beispiel: `?expand=ticket_classes,venue`
- Lädt verwandte Objekte in einer Anfrage
- System wird aktuell überarbeitet

### 9.3 Pagination

**Standard-Pagination:**[2]
- Standardmäßig 50 Ergebnisse pro Seite
- Pagination-Objekt in Responses enthalten
- Parameter: `page`, `page_size`
- Maximale Seitengröße variiert je Endpoint

## 10. Schlussfolgerungen und Empfehlungen

### 10.1 API-Stärken

Die Eventbrite API v3 zeigt sich als robuste und gut durchdachte Lösung für Event-Management-Integrationen:

- **Umfassende Funktionalität:** Vollständige CRUD-Operationen für alle Event-Aspekte
- **Sicherheit:** OAuth 2.0 mit Best-Practice-Empfehlungen
- **Flexibilität:** Unterstützt sowohl einfache als auch komplexe Event-Szenarien
- **Real-Time-Updates:** Webhook-System für Status-Änderungen
- **Entwicklerfreundlich:** API Explorer und umfassende Dokumentation

### 10.2 Implementierungsempfehlungen

**Für Neue Integrationen:**
1. Verwenden Sie organization-basierte Endpunkte
2. Implementieren Sie Server-Side OAuth-Flow
3. Planen Sie Retry-Logik für Rate Limits ein
4. Nutzen Sie Webhooks für Echtzeit-Updates
5. Verwenden Sie Expansion-Parameter zur Optimierung

**Sicherheitsempfehlungen:**
1. Token serverseitig verwalten
2. Regelmäßige Token-Rotation
3. Private Webhook-URLs verwenden
4. Comprehensive Error-Handling implementieren

### 10.3 Zukunftssicherheit

Die API zeigt eine klare Evolutionsstrategie mit:
- Proaktive Kommunikation über Änderungen
- Strukturierte Migrationspfade für deprecated Features
- Kontinuierliche Verbesserungen (wie das neue Rate Limiting System 2025)

## 11. Quellen

[1] [Intro to Authentication - Documentation](https://www.eventbrite.com/platform/docs/authentication) - Hohe Zuverlässigkeit - Offizielle Eventbrite Platform Dokumentation für OAuth 2.0 und API-Key Authentifizierung

[2] [API Basics - Documentation](https://www.eventbrite.com/platform/docs/api-basics) - Hohe Zuverlässigkeit - Offizielle API-Grundlagen der Eventbrite Platform

[3] [App OAuth Flow - Documentation](https://www.eventbrite.com/platform/docs/app-oauth-flow) - Hohe Zuverlässigkeit - Offizielle Dokumentation für OAuth-Flows

[4] [Creating an Event - Documentation](https://www.eventbrite.com/platform/docs/create-events) - Hohe Zuverlässigkeit - Offizielle Event Creation API-Dokumentation

[5] [Ticket Classes and Ticket Groups - Documentation](https://www.eventbrite.com/platform/docs/ticket-classes) - Hohe Zuverlässigkeit - Offizielle Ticketing-System-Dokumentation

[6] [Including an Image with Your Event Listing](https://www.eventbrite.com/platform/docs/image-upload) - Hohe Zuverlässigkeit - Offizielle Image-Upload-Dokumentation

[7] [Using Webhooks - Documentation](https://www.eventbrite.com/platform/docs/webhooks) - Hohe Zuverlässigkeit - Offizielle Webhook-Dokumentation

[8] [Venue Creation](https://www.educative.io/courses/exploring-the-eventbrite-api-in-javascript/venue-creation) - Mittlere Zuverlässigkeit - Bildungsressource für Venue-Management

[9] [Rate Limits - Documentation](https://www.eventbrite.com/platform/docs/rate-limits) - Hohe Zuverlässigkeit - Offizielle Rate Limiting Dokumentation

[10] [Changelog - Documentation](https://www.eventbrite.com/platform/docs/changelog) - Hohe Zuverlässigkeit - Offizielle API-Änderungsdokumentation

[11] [Exploring the API - Documentation](https://www.eventbrite.com/platform/docs/api-explorer) - Hohe Zuverlässigkeit - Offizielle API Explorer Dokumentation

[12] [Understanding Organizations - Documentation](https://www.eventbrite.com/platform/docs/organizations) - Hohe Zuverlässigkeit - Offizielle Organisationsarchitektur-Dokumentation
