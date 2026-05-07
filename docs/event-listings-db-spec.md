# Event Listings — Database Specification

**Portal:** TLB Partner Portal  
**Module:** Events (4-step creation wizard)  
**Prepared for:** Backend Developer  
**Date:** 2026-05-07  

---

## Overview

An **Event** is a one-time or single-run happening — a performance, festival, workshop, or competition — created by a TLB partner. Events have a fixed start/end datetime, optional ticket tiers or a free capacity cap, and media assets. They go through a draft → review → published lifecycle.

> **Note:** Events are the only listing type currently **fully API-integrated** on the frontend. The existing API (`/api/v1/partners/listings/`) powers the 4-step wizard already. This spec documents the complete expected schema to ensure alignment.

---

## Entity Relationship Summary

```
partners (existing)
  └── events (listings)          (1 partner → many events)
        ├── event_tickets         (1 event → many ticket tiers)
        └── event_media           (1 event → many media items)
```

---

## Tables

### 1. `events` (maps to `/api/v1/partners/listings/`)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `partner_id` | UUID / FK | NOT NULL, FK → `partners.id` | Owning partner |
| `listing_type` | VARCHAR(20) | NOT NULL, DEFAULT `event` | Discriminator: `event` |
| `title` | VARCHAR(200) | NOT NULL | Event title, e.g. "Summer Art Festival" |
| `description` | TEXT | NOT NULL | Full event description |
| `category_id` | INT / FK | NULLABLE, FK → `event_categories.id` | Top-level category (from API metadata) |
| `subcategory_id` | INT / FK | NULLABLE, FK → `event_subcategories.id` | Sub-category |
| `format` | VARCHAR(50) | NULLABLE | From API metadata e.g. "Workshop", "Performance" |
| `age_group_type` | VARCHAR(10) | NULLABLE | `static` or `custom` |
| `age_min` | SMALLINT | NULLABLE | Minimum age (years) |
| `age_max` | SMALLINT | NULLABLE | Maximum age (years) |
| `mode` | VARCHAR(10) | NOT NULL, DEFAULT `offline` | Enum: `online`, `offline`, `hybrid` |
| `city` | VARCHAR(100) | NULLABLE | Required when mode = `offline` or `hybrid` |
| `area` | VARCHAR(100) | NULLABLE | Neighbourhood / area |
| `address` | TEXT | NULLABLE | Full street address; required when mode = `offline` or `hybrid` |
| `meeting_link` | VARCHAR(1000) | NULLABLE | Required when mode = `online` or `hybrid` |
| `start_datetime` | TIMESTAMPTZ | NULLABLE | ISO 8601 event start |
| `end_datetime` | TIMESTAMPTZ | NULLABLE | ISO 8601 event end; must be > `start_datetime` |
| `registration_deadline` | TIMESTAMPTZ | NULLABLE | Must be ≤ `start_datetime` |
| `price_type` | VARCHAR(10) | NOT NULL, DEFAULT `free` | Enum: `free`, `paid` |
| `capacity` | INT | NULLABLE | Used when `price_type = free`; backend auto-creates a "Free Entry" ticket |
| `available_seats` | INT | NULLABLE | Computed: total capacity minus sold tickets (read-only in API) |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT `draft` | Lifecycle status (see below) |
| `rejection_reason` | TEXT | NULLABLE | Admin rejection message |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `published_at` | TIMESTAMPTZ | NULLABLE | Set on status → `published` |

#### Status Enum

| Value | Meaning |
|---|---|
| `draft` | Partner is still editing |
| `pending` | Submitted for admin review |
| `published` | Live and visible |
| `rejected` | Rejected by admin with reason |
| `archived` | Soft-deleted / taken offline |

---

### 2. `event_tickets`

Ticket tiers for paid events. For free events, the backend auto-creates a single "Free Entry" ticket.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGSERIAL | PK | Primary key |
| `event_id` | UUID / FK | NOT NULL, FK → `events.id` ON DELETE CASCADE | Parent event |
| `name` | VARCHAR(100) | NOT NULL | e.g. "General Admission", "VIP Pass" |
| `price` | DECIMAL(10,2) | NOT NULL, ≥ 0 | Ticket price in INR; 0.00 for "Free Entry" ticket |
| `total_quantity` | INT | NOT NULL, > 0 | Total tickets available |
| `available_quantity` | INT | NOT NULL | Remaining tickets (decremented on purchase) |
| `description` | VARCHAR(500) | NULLABLE | Short description of what's included |
| `is_default` | BOOLEAN | NOT NULL, DEFAULT FALSE | True for the auto-created "Free Entry" ticket |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

### 3. `event_media`

Media assets attached to an event.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGSERIAL | PK | Primary key |
| `event_id` | UUID / FK | NOT NULL, FK → `events.id` ON DELETE CASCADE | Parent event |
| `media_type` | VARCHAR(10) | NOT NULL | Enum: `cover`, `gallery`, `video` |
| `file_url` | VARCHAR(1000) | NOT NULL | CDN / S3 URL |
| `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Sort order for gallery |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

> Only 1 `cover` and 1 `video` allowed per event. Gallery max: 10 images.

---

## API Endpoints (Existing + Expected)

### Events

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/partners/listings/create/` | Create draft event |
| `GET` | `/api/v1/partners/listings/` | List all partner events (filterable by `?status=`) |
| `GET` | `/api/v1/partners/listings/{id}/` | Full event detail (nested tickets + media) |
| `PUT` | `/api/v1/partners/listings/{id}/update/` | Update event fields (partial) |
| `POST` | `/api/v1/partners/listings/{id}/submit/` | Submit for review (`draft` → `pending`) |

### Tickets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/partners/listings/{id}/tickets/` | List tickets for event |
| `POST` | `/api/v1/partners/listings/{id}/tickets/` | Create ticket tier |
| `PUT` | `/api/v1/partners/listings/{id}/tickets/{tid}/` | Update ticket tier |
| `DELETE` | `/api/v1/partners/listings/{id}/tickets/{tid}/` | Delete ticket tier |

### Media

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/partners/listings/{id}/media/` | List media items |
| `POST` | `/api/v1/partners/listings/{id}/media/` | Upload media (multipart/form-data with `file` + `media_type`) |
| `DELETE` | `/api/v1/partners/listings/{id}/media/{mid}/` | Delete media item |

### Metadata (for wizard dropdowns)

| Method | Endpoint | Returns |
|---|---|---|
| `GET` | `/api/v1/listings/metadata/categories/` | `[{ id, name, slug, subcategories: [{id, name, slug}] }]` |
| `GET` | `/api/v1/listings/metadata/formats/` | `[{ value, label }]` |
| `GET` | `/api/v1/listings/metadata/age-groups/` | `{ static_ranges: [{min_age, max_age, label}], custom_range: {enabled, min_allowed_age, max_allowed_age} }` |

---

## Request / Response Shapes

### `POST /api/v1/partners/listings/create/` — Create Draft

```json
{
  "title": "Summer Art Festival",
  "description": "A vibrant outdoor festival..."
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "status": "draft",
  "listing_type": "event",
  "created_at": "2026-05-07T10:00:00Z"
}
```

---

### `PUT /api/v1/partners/listings/{id}/update/` — Update Fields

```json
{
  "title": "Summer Art Festival",
  "description": "Full description...",
  "category_id": 3,
  "subcategory_id": 12,
  "format": "Festival",
  "age_group": { "type": "static", "min_age": 5, "max_age": 14 },
  "mode": "offline",
  "city": "Mumbai",
  "area": "Bandra",
  "address": "Carter Road, Bandra West",
  "start_datetime": "2026-06-15T10:00:00Z",
  "end_datetime": "2026-06-15T17:00:00Z",
  "registration_deadline": "2026-06-14T23:59:00Z",
  "price_type": "paid"
}
```

---

### `GET /api/v1/partners/listings/{id}/` — Full Event Detail

```json
{
  "id": "uuid",
  "listing_type": "event",
  "title": "Summer Art Festival",
  "description": "...",
  "category": { "id": 3, "name": "Visual Arts" },
  "subcategory": { "id": 12, "name": "Painting" },
  "format": "Festival",
  "age_group": { "type": "static", "min_age": 5, "max_age": 14 },
  "mode": "offline",
  "city": "Mumbai",
  "area": "Bandra",
  "address": "Carter Road, Bandra West",
  "meeting_link": null,
  "start_datetime": "2026-06-15T10:00:00Z",
  "end_datetime": "2026-06-15T17:00:00Z",
  "registration_deadline": "2026-06-14T23:59:00Z",
  "price_type": "paid",
  "capacity": null,
  "available_seats": 120,
  "status": "draft",
  "tickets": [
    {
      "id": 1,
      "name": "General Admission",
      "price": 499.00,
      "total_quantity": 100,
      "available_quantity": 100,
      "description": "Entry + activity kit",
      "is_default": false
    }
  ],
  "media": [
    {
      "id": 1,
      "media_type": "cover",
      "file_url": "https://cdn.tlb.in/events/uuid/cover.jpg",
      "display_order": 0
    }
  ]
}
```

---

## Submission Readiness Rules

The frontend checks these fields before enabling the "Submit for Review" button. The backend must enforce the same on `POST .../submit/`:

| Field | Rule |
|---|---|
| `title` | Non-empty |
| `description` | Non-empty |
| `category_id` | Must be set |
| `subcategory_id` | Must be set |
| `format` | Must be set |
| `age_group` | Must have valid `min_age` and `max_age` |
| `start_datetime` | Must be set |
| `end_datetime` | Must be set and > `start_datetime` |
| `mode` | Must be set |
| `city` + `address` | Required when mode = `offline` or `hybrid` |
| `meeting_link` | Required when mode = `online` or `hybrid` |
| `price_type` | Must be set |
| `capacity` | Required when `price_type = free` |
| At least 1 ticket | Required when `price_type = paid` |
| Cover image | At least 1 `event_media` with `media_type = cover` |

Return `400` with a list of missing fields on failure.

---

## Media Constraints

| Type | Formats | Max Size | Max Count |
|---|---|---|---|
| `cover` | JPG, PNG | 5 MB | 1 |
| `gallery` | JPG, PNG | 5 MB each | 10 |
| `video` | MP4, MOV | 100 MB | 1 |

---

## Indexes

```sql
CREATE INDEX idx_events_partner_id ON events(partner_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start ON events(start_datetime);
CREATE INDEX idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX idx_event_media_event_id ON event_media(event_id);
```

---

## Notes for the Backend Developer

1. **Price type switch:** When `price_type` changes from `paid` → `free`, auto-delete all existing non-default tickets and create the "Free Entry" default ticket using `capacity`. The frontend warns users of this behaviour before saving.
2. **Free Entry ticket:** When `price_type = free`, create a single `event_tickets` row with `name = "Free Entry"`, `price = 0`, `total_quantity = capacity`, `is_default = true`. This simplifies the booking system.
3. **`available_seats`:** Compute at query time from ticket quantities, do not store separately.
4. **Draft ID persistence:** The frontend stores the active draft ID in `sessionStorage` as `current_event_draft_id`. The `id` returned by `POST .../create/` must be a stable UUID or integer that can be used for all subsequent updates.
5. **Partner scoping:** All endpoints must filter by `request.user.partner_id`.
6. **`listing_type` field:** If the same `listings` table is shared across event / class / program / venue entities, use a `listing_type` discriminator column to filter correctly.
