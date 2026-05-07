# Program Listings — Database Specification

**Portal:** TLB Partner Portal  
**Module:** Programs (5-step creation wizard)  
**Prepared for:** Backend Developer  
**Date:** 2026-05-07  

---

## Overview

A **Program** is a structured, recurring educational/skill offering by a TLB partner (e.g. Robotics, Dance, Coding). Each program has an identity, one or more batches/schedules, media assets, and entry policies. Programs go through a review lifecycle before being visible to the public.

---

## Entity Relationship Summary

```
partners (existing)
  └── programs              (1 partner → many programs)
        ├── program_batches (1 program → many batches)
        ├── program_media   (1 program → many media items)
        └── program_faqs    (1 program → many FAQs)
```

---

## Tables

### 1. `programs`

Core listing record.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `partner_id` | UUID / FK | NOT NULL, FK → `partners.id` | Owning partner |
| `title` | VARCHAR(255) | NOT NULL | Service/program title, e.g. "Advanced Robotics" |
| `description` | TEXT | NOT NULL | Master description — full story, curriculum, what to bring |
| `min_age` | SMALLINT | NOT NULL, ≥ 0 | Minimum target age (years) |
| `max_age` | SMALLINT | NOT NULL, ≥ min_age | Maximum target age (years) |
| `format` | VARCHAR(20) | NOT NULL | Enum: `physical`, `online`, `hybrid`, `trial` |
| `location` | VARCHAR(500) | NULLABLE | Venue address; required when format = `physical` or `hybrid` |
| `category` | VARCHAR(100) | NOT NULL | Top-level category (see Category Reference below) |
| `subcategory` | VARCHAR(100) | NOT NULL | Sub-category under the parent category |
| `tags` | TEXT[] / JSON | NULLABLE | Array of tags e.g. `["Beginner Friendly", "Certification"]` |
| `feature_image_url` | VARCHAR(1000) | NULLABLE | URL of the starred/main thumbnail from the media gallery |
| `video_url` | VARCHAR(1000) | NULLABLE | YouTube or Instagram Reels embed URL |
| `cancellation_policy` | TEXT | NULLABLE | Free-text cancellation terms |
| `refund_policy` | TEXT | NULLABLE | Free-text refund terms |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT `draft` | Lifecycle status (see Status Enum below) |
| `rejection_reason` | TEXT | NULLABLE | Populated by admin on rejection |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `published_at` | TIMESTAMPTZ | NULLABLE | Set when status transitions to `published` |

#### Status Enum

| Value | Meaning |
|---|---|
| `draft` | Saved by partner, not submitted |
| `pending_review` | Submitted — awaiting admin approval |
| `published` | Live and visible to parents/public |
| `rejected` | Rejected by admin with reason |
| `archived` | Soft-deleted / taken offline by partner |

---

### 2. `program_batches`

Each program can have multiple concurrent batches (e.g. Morning, Weekend). A batch defines **when** a program runs and how many students it can take.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `program_id` | UUID / FK | NOT NULL, FK → `programs.id` ON DELETE CASCADE | Parent program |
| `name` | VARCHAR(100) | NOT NULL | Batch label, e.g. "Morning Batch" |
| `days` | TEXT[] / JSON | NOT NULL | Days of week: subset of `["M","T","W","Th","F","S","Su"]` |
| `start_time` | TIME | NOT NULL | Batch start time, e.g. `07:00` |
| `end_time` | TIME | NOT NULL | Batch end time, e.g. `08:00` |
| `max_capacity` | SMALLINT | NOT NULL, > 0 | Maximum number of students allowed |
| `enrolled_count` | SMALLINT | NOT NULL, DEFAULT 0 | Current enrolled students (incremented by enquiry/booking system) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Can be toggled to pause a batch without deleting |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

> `available_spots` = `max_capacity - enrolled_count` — compute at query time, do not store.

---

### 3. `program_media`

Gallery photos and teaser video files for a program.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `program_id` | UUID / FK | NOT NULL, FK → `programs.id` ON DELETE CASCADE | Parent program |
| `media_type` | VARCHAR(20) | NOT NULL | Enum: `image`, `video` |
| `url` | VARCHAR(1000) | NOT NULL | CDN / S3 URL of the asset |
| `is_feature` | BOOLEAN | NOT NULL, DEFAULT FALSE | True for the single starred thumbnail; unique per program |
| `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Sort order in gallery |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

> Enforce only one `is_feature = TRUE` per `program_id` via a partial unique index or application logic.

---

### 4. `program_faqs`

Frequently Asked Questions attached to a listing.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `program_id` | UUID / FK | NOT NULL, FK → `programs.id` ON DELETE CASCADE | Parent program |
| `question` | VARCHAR(500) | NOT NULL | FAQ question |
| `answer` | TEXT | NOT NULL | FAQ answer |
| `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Display order on listing page |

---

## API Endpoints Required

### Programs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/programs/` | Create a new program (starts as `draft`) |
| `GET` | `/api/v1/programs/` | List all programs for the authenticated partner |
| `GET` | `/api/v1/programs/{id}/` | Retrieve a single program with nested batches, media, faqs |
| `PATCH` | `/api/v1/programs/{id}/` | Update program fields |
| `DELETE` | `/api/v1/programs/{id}/` | Soft-delete (set status to `archived`) |
| `POST` | `/api/v1/programs/{id}/submit/` | Submit for review (`draft` → `pending_review`) |

### Batches

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/programs/{id}/batches/` | Add a batch to a program |
| `PATCH` | `/api/v1/programs/{id}/batches/{batch_id}/` | Update a batch |
| `DELETE` | `/api/v1/programs/{id}/batches/{batch_id}/` | Remove a batch |

### Media

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/programs/{id}/media/` | Upload a photo or teaser (multipart/form-data) |
| `PATCH` | `/api/v1/programs/{id}/media/{media_id}/` | Set `is_feature`, update `display_order` |
| `DELETE` | `/api/v1/programs/{id}/media/{media_id}/` | Delete a media item |

### FAQs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/programs/{id}/faqs/` | Add an FAQ |
| `PATCH` | `/api/v1/programs/{id}/faqs/{faq_id}/` | Edit an FAQ |
| `DELETE` | `/api/v1/programs/{id}/faqs/{faq_id}/` | Delete an FAQ |

---

## Request / Response Shapes

### `POST /api/v1/programs/` — Create Program

```json
{
  "title": "Advanced Robotics",
  "description": "Learn robotics from scratch...",
  "min_age": 8,
  "max_age": 14,
  "format": "physical",
  "location": "123 Broadway Lane, Mumbai",
  "category": "Future Tech & AI",
  "subcategory": "Robotics & Automation",
  "tags": ["Beginner Friendly", "Certification", "Trial Available"],
  "cancellation_policy": "Cancellations must be made 24 hours in advance...",
  "refund_policy": "No refunds after the first class...",
  "video_url": "https://youtube.com/watch?v=xxxx"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "partner_id": "uuid",
  "status": "draft",
  "created_at": "2026-05-07T10:00:00Z",
  ...all fields
}
```

---

### `GET /api/v1/programs/{id}/` — Full Listing Detail

```json
{
  "id": "uuid",
  "title": "Advanced Robotics",
  "description": "...",
  "min_age": 8,
  "max_age": 14,
  "format": "physical",
  "location": "123 Broadway Lane",
  "category": "Future Tech & AI",
  "subcategory": "Robotics & Automation",
  "tags": ["Beginner Friendly", "Certification"],
  "feature_image_url": "https://cdn.tlb.in/programs/uuid/feature.jpg",
  "video_url": "https://youtube.com/...",
  "cancellation_policy": "...",
  "refund_policy": "...",
  "status": "published",
  "published_at": "2026-05-08T09:00:00Z",
  "batches": [
    {
      "id": "uuid",
      "name": "Morning Batch",
      "days": ["M", "W", "F"],
      "start_time": "07:00",
      "end_time": "08:00",
      "max_capacity": 15,
      "enrolled_count": 8,
      "is_active": true
    }
  ],
  "media": [
    {
      "id": "uuid",
      "media_type": "image",
      "url": "https://cdn.tlb.in/...",
      "is_feature": true,
      "display_order": 0
    }
  ],
  "faqs": [
    {
      "id": "uuid",
      "question": "What should my child bring?",
      "answer": "Just a laptop and curiosity!",
      "display_order": 0
    }
  ]
}
```

---

## Category Reference

The following category → subcategory tree is used in the wizard dropdowns.

| Category | Subcategories |
|---|---|
| Future Tech & AI | Coding & Programming, Robotics & Automation, Artificial Intelligence (AI), Game Development, App Development, Electronics & IoT |
| Design & Innovation | Visual Arts, Craft & DIY Creations, Fashion & Textile Design, Graphic & Digital Design, Design Thinking & Innovation |
| Leadership & Entrepreneurship | Entrepreneurship & Startups, Financial Literacy, Leadership & Confidence, Business & Marketing Basics, Problem Solving & Decision Making |
| Media & Content Creation | Animation, Video Creation & Editing, Filmmaking, Content Creation, Photography, Journalism & Mass Communication |
| Stage Arts & Performance | Dance, Music (Vocal & Instrumental), Theatre & Acting, Stage Performance |
| Active Sports & Training | Sports Coaching, Fitness & Strength Training, Yoga & Mindfulness, Adventure & Outdoor Programs, Motorsports Training |
| Academics & Competitive Prep | Subject-Focused Programs, Olympiad Preparation, Entrance Exam Preparation, Smart Study Skills |
| Analytical Thinking | Abacus, Vedic Maths, Logical Reasoning, Problem Solving, Memory & Focus Development |
| Language & Communication | Spoken English, Public Speaking, Debate & Communication Skills, Creative Writing, Foreign Languages, Indian Languages |
| Culinary & Hospitality | Cooking & Baking, Culinary Arts, Chef Programs, Hospitality & Hotel Management, Food Presentation & Service Skills |
| Grooming & Personality Development | Personal Grooming, Etiquette & Manners, Personality Development, Confidence Building, Personal Styling |

> These values should ideally be stored in a separate `program_categories` lookup table for maintainability, or validated against a static enum at the API level.

---

## Tag Reference

Valid values for the `tags` array:

```
Beginner Friendly | Advanced | Certification | Weekend Only | Trial Available | Group Class | One-on-One
```

---

## Format Enum Values

| Frontend Label | DB Value | Location Required |
|---|---|---|
| Physical | `physical` | Yes |
| Online | `online` | No |
| Hybrid | `hybrid` | Yes |
| Trial | `trial` | No |

---

## Indexes

```sql
-- Listings by partner
CREATE INDEX idx_programs_partner_id ON programs(partner_id);

-- Filter by status
CREATE INDEX idx_programs_status ON programs(status);

-- Feature image uniqueness per program
CREATE UNIQUE INDEX idx_program_media_feature ON program_media(program_id)
  WHERE is_feature = TRUE;

-- Batch lookup by program
CREATE INDEX idx_program_batches_program_id ON program_batches(program_id);
```

---

## Notes for the Backend Developer

1. **Draft auto-save**: The frontend submits fields step-by-step. Support partial `PATCH` updates so a draft can be saved at any stage without all fields being present.
2. **Submit action**: `POST /programs/{id}/submit/` transitions `draft → pending_review`. Validate all required fields before accepting the transition; return `400` with a list of missing fields if incomplete.
3. **Feature image sync**: When a `program_media` record's `is_feature` is set to `TRUE`, unset it on all other media rows for the same `program_id` atomically.
4. **Cascade deletes**: All child tables (`program_batches`, `program_media`, `program_faqs`) should cascade-delete when the parent program is deleted.
5. **Partner scoping**: All endpoints must scope queries to `request.user.partner_id` — a partner must never be able to read or modify another partner's programs.
6. **`enrolled_count`**: This is managed by the enquiry/booking system, not the listings API. Expose it as read-only in the programs API response.
