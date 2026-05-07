# Venue Listings — Database Specification

**Portal:** TLB Partner Portal  
**Module:** Venues (5-step creation wizard)  
**Prepared for:** Backend Developer  
**Date:** 2026-05-07  

---

## Overview

A **Venue** is a physical space listed by a TLB partner for hire — party halls, performance spaces, activity centres, etc. Unlike events or classes, venues are booked by occasion and time slot. They have packages (priced tiers) and define what attendee information to collect at checkout. The wizard uses an amber theme.

---

## Entity Relationship Summary

```
partners (existing)
  └── venues                    (1 partner → many venues)
        ├── venue_occasions      (1 venue → many supported occasion types)
        ├── venue_availability   (1 venue → many available date+slot records)
        ├── venue_packages       (1 venue → many price packages)
        └── venue_media          (1 venue → many media items)
```

---

## Tables

### 1. `venues`

Core venue listing record.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `partner_id` | UUID / FK | NOT NULL, FK → `partners.id` | Owning partner |
| `name` | VARCHAR(255) | NOT NULL | Venue name, e.g. "Royal Kids Party Hall" |
| `description` | TEXT | NOT NULL | Ambiance, facilities, and why it's perfect for events |
| `location` | VARCHAR(500) | NOT NULL | Full location, e.g. "Powai, Mumbai" |
| `category` | VARCHAR(100) | NOT NULL | Top-level venue category (see Category Reference) |
| `subcategory` | VARCHAR(100) | NULLABLE | Sub-category under parent |
| `min_capacity` | SMALLINT | NOT NULL, > 0 | Minimum number of guests/kids |
| `max_capacity` | SMALLINT | NOT NULL, ≥ min_capacity | Maximum number of guests/kids |
| `required_attendee_fields` | TEXT[] / JSON | NULLABLE | Fields collected at checkout: subset of `["Child Name","Child Age","Parent Name","Contact Number","Email ID"]` |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT `draft` | Lifecycle status (see below) |
| `rejection_reason` | TEXT | NULLABLE | Admin rejection message |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `published_at` | TIMESTAMPTZ | NULLABLE | Set on status → `published` |

#### Status Enum

| Value | Meaning |
|---|---|
| `draft` | Saved, not submitted |
| `pending_review` | Submitted for admin approval |
| `published` | Live and bookable |
| `rejected` | Rejected with reason |
| `archived` | Soft-deleted / taken offline |

---

### 2. `venue_occasions`

Occasion types the venue supports (multi-select).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGSERIAL | PK | Primary key |
| `venue_id` | UUID / FK | NOT NULL, FK → `venues.id` ON DELETE CASCADE | Parent venue |
| `occasion` | VARCHAR(50) | NOT NULL | Enum: `Birthday`, `Playdate`, `Celebration`, `Workshop`, `Meetup`, `Showcase` |

> Alternatively store as a `TEXT[]` column on `venues` directly if you prefer a simpler schema.

---

### 3. `venue_availability`

Calendar availability — which dates and time slots the venue is open for booking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGSERIAL | PK | Primary key |
| `venue_id` | UUID / FK | NOT NULL, FK → `venues.id` ON DELETE CASCADE | Parent venue |
| `available_date` | DATE | NOT NULL | The calendar date |
| `time_slot` | VARCHAR(20) | NOT NULL | Enum: `Morning`, `Afternoon`, `Evening` |
| `is_booked` | BOOLEAN | NOT NULL, DEFAULT FALSE | Set to TRUE when a booking is confirmed for this slot |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

#### Time Slot Reference

| Value | Time Range |
|---|---|
| `Morning` | 8:00 AM – 12:00 PM |
| `Afternoon` | 12:00 PM – 4:00 PM |
| `Evening` | 4:00 PM – 9:00 PM |

> Unique constraint on `(venue_id, available_date, time_slot)` to prevent duplicate slots.

---

### 4. `venue_packages`

Priced tiers / bundles offered by the venue.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `venue_id` | UUID / FK | NOT NULL, FK → `venues.id` ON DELETE CASCADE | Parent venue |
| `name` | VARCHAR(100) | NOT NULL | Package name, e.g. "Basic Party", "Premium Experience" |
| `price` | DECIMAL(10,2) | NOT NULL, ≥ 0 | Price in INR |
| `description` | TEXT | NULLABLE | What's included — decorations, food, host, etc. |
| `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Sort order |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

### 5. `venue_media`

Cover image and gallery photos for a venue.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `venue_id` | UUID / FK | NOT NULL, FK → `venues.id` ON DELETE CASCADE | Parent venue |
| `media_type` | VARCHAR(10) | NOT NULL | Enum: `cover`, `gallery` |
| `url` | VARCHAR(1000) | NOT NULL | CDN / S3 URL |
| `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Sort order in gallery |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

> Only 1 `cover` allowed per venue.

---

## API Endpoints Required

### Venues

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/venues/` | Create venue (starts as `draft`) |
| `GET` | `/api/v1/venues/` | List all venues for the authenticated partner |
| `GET` | `/api/v1/venues/{id}/` | Full venue detail (nested occasions, availability, packages, media) |
| `PATCH` | `/api/v1/venues/{id}/` | Update venue fields |
| `DELETE` | `/api/v1/venues/{id}/` | Soft-delete (set status to `archived`) |
| `POST` | `/api/v1/venues/{id}/submit/` | Submit for review |

### Occasions

| Method | Endpoint | Description |
|---|---|---|
| `PUT` | `/api/v1/venues/{id}/occasions/` | Replace the full set of supported occasions (array replace, not append) |

### Availability

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/venues/{id}/availability/` | List available date+slot records |
| `POST` | `/api/v1/venues/{id}/availability/` | Add one or more date+slot entries |
| `DELETE` | `/api/v1/venues/{id}/availability/{avail_id}/` | Remove a date+slot entry |
| `PUT` | `/api/v1/venues/{id}/availability/bulk/` | Replace entire availability schedule (array replace) |

### Packages

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/venues/{id}/packages/` | Add a package |
| `PATCH` | `/api/v1/venues/{id}/packages/{pkg_id}/` | Update a package |
| `DELETE` | `/api/v1/venues/{id}/packages/{pkg_id}/` | Delete a package |

### Media

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/venues/{id}/media/` | Upload cover or gallery image (multipart/form-data) |
| `PATCH` | `/api/v1/venues/{id}/media/{mid}/` | Update `display_order` |
| `DELETE` | `/api/v1/venues/{id}/media/{mid}/` | Delete a media item |

---

## Request / Response Shapes

### `POST /api/v1/venues/` — Create Venue

```json
{
  "name": "Royal Kids Party Hall",
  "description": "A beautiful, fully air-conditioned party hall...",
  "location": "Powai, Mumbai",
  "category": "Party Hall",
  "subcategory": "Birthday Venue",
  "min_capacity": 10,
  "max_capacity": 50,
  "required_attendee_fields": ["Child Name", "Child Age", "Contact Number"]
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "status": "draft",
  "created_at": "2026-05-07T10:00:00Z"
}
```

---

### `PUT /api/v1/venues/{id}/occasions/` — Set Occasions

```json
{
  "occasions": ["Birthday", "Playdate", "Celebration"]
}
```

---

### `PUT /api/v1/venues/{id}/availability/bulk/` — Set Availability

```json
{
  "slots": [
    { "available_date": "2026-06-21", "time_slot": "Morning" },
    { "available_date": "2026-06-21", "time_slot": "Afternoon" },
    { "available_date": "2026-06-23", "time_slot": "Evening" }
  ]
}
```

---

### `GET /api/v1/venues/{id}/` — Full Venue Detail

```json
{
  "id": "uuid",
  "name": "Royal Kids Party Hall",
  "description": "...",
  "location": "Powai, Mumbai",
  "category": "Party Hall",
  "subcategory": "Birthday Venue",
  "min_capacity": 10,
  "max_capacity": 50,
  "required_attendee_fields": ["Child Name", "Child Age", "Contact Number"],
  "status": "published",
  "occasions": ["Birthday", "Playdate", "Celebration"],
  "availability": [
    { "id": 1, "available_date": "2026-06-21", "time_slot": "Morning", "is_booked": false },
    { "id": 2, "available_date": "2026-06-21", "time_slot": "Afternoon", "is_booked": true }
  ],
  "packages": [
    {
      "id": "uuid",
      "name": "Basic Party",
      "price": 15000.00,
      "description": "Venue access, standard decoration, basic sound system.",
      "display_order": 0
    },
    {
      "id": "uuid",
      "name": "Standard (Special Treat)",
      "price": 20000.00,
      "description": "Basic + theme decoration, host, and return gifts.",
      "display_order": 1
    }
  ],
  "media": [
    {
      "id": 1,
      "media_type": "cover",
      "url": "https://cdn.tlb.in/venues/uuid/cover.jpg",
      "display_order": 0
    }
  ]
}
```

---

## Category Reference

| Category | Example Subcategories |
|---|---|
| Party Hall | Birthday Venue, Anniversary Hall, Corporate Event Space |
| Activity Centre | Sports Arena, Art Studio, Dance Studio |
| Performance Space | Theatre, Black Box, Recital Hall |
| Outdoor Space | Garden, Rooftop, Open-air Amphitheatre |
| Classroom / Studio | Coaching Room, Workshop Studio, Recording Studio |
| Community Hall | Banquet Hall, Club House, Society Hall |

> The full category tree is defined in `src/data/venueCategories.tsx`. Backend should store the string values directly (or map to a `venue_categories` lookup table).

---

## Occasion Reference

| Value | Description |
|---|---|
| `Birthday` | Birthday parties for children |
| `Playdate` | Informal play sessions |
| `Celebration` | General celebrations, milestones |
| `Workshop` | Educational or skill workshops |
| `Meetup` | Group meetups and networking |
| `Showcase` | Talent shows, exhibitions, performances |

---

## Attendee Field Reference

Fields the venue operator can require at checkout:

```
Child Name | Child Age | Parent Name | Contact Number | Email ID
```

---

## Indexes

```sql
CREATE INDEX idx_venues_partner_id ON venues(partner_id);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venue_availability_venue_id ON venue_availability(venue_id);
CREATE INDEX idx_venue_availability_date ON venue_availability(available_date);
CREATE UNIQUE INDEX idx_venue_availability_slot ON venue_availability(venue_id, available_date, time_slot);
CREATE INDEX idx_venue_packages_venue_id ON venue_packages(venue_id);
```

---

## Notes for the Backend Developer

1. **Partial saves:** Support `PATCH` with any subset of fields. The wizard saves step-by-step without all fields present until submission.
2. **Submit validation:** On `POST .../submit/`, check that `name`, `description`, `location`, `category`, `min_capacity`, `max_capacity`, at least 1 `venue_occasion`, at least 1 `venue_availability` slot, and at least 1 `venue_package` are set. Return `400` with missing field list.
3. **Availability management:** The frontend sends a date+timeslot toggle pattern. Use the bulk replace endpoint (`PUT .../availability/bulk/`) to keep availability in sync from the wizard; use the granular add/remove endpoints for future calendar management UI.
4. **`is_booked` flag:** Managed by the booking system, not the listing wizard. Expose as read-only in venue detail responses.
5. **Cover image:** Only 1 `venue_media` row with `media_type = cover` allowed per venue. Enforce at API level.
6. **Partner scoping:** All endpoints must filter by `request.user.partner_id`.
7. **Occasions as array:** The occasions selection is a replace-all pattern (not append). Accept the full array on `PUT` and replace existing rows atomically.
