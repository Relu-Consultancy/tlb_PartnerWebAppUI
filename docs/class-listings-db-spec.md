# Class Listings — Database Specification

**Portal:** TLB Partner Portal  
**Module:** Classes (5-step creation wizard)  
**Prepared for:** Backend Developer  
**Date:** 2026-05-07  

---

## Overview

A **Class** is a recurring, structured learning offering by a TLB partner (e.g. Painting, Coding, Dance). Classes run on a weekly batch schedule, support multiple concurrent batches, and have pricing at the batch level. They are the primary offering type for most partners. The wizard is identical in structure to Programs (same 5 steps), but with a different category taxonomy and a yellow theme.

---

## Entity Relationship Summary

```
partners (existing)
  └── classes                   (1 partner → many classes)
        ├── class_batches        (1 class → many batches)
        ├── class_media          (1 class → many media items)
        └── class_faqs           (1 class → many FAQs)
```

---

## Tables

### 1. `classes`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `partner_id` | UUID / FK | NOT NULL, FK → `partners.id` | Owning partner |
| `title` | VARCHAR(255) | NOT NULL | Class title, e.g. "Advanced Robotics for Kids" |
| `description` | TEXT | NOT NULL | Master description — curriculum, what to bring, certifications |
| `min_age` | SMALLINT | NOT NULL, ≥ 0 | Minimum target age (years) |
| `max_age` | SMALLINT | NOT NULL, ≥ min_age | Maximum target age (years) |
| `format` | VARCHAR(20) | NOT NULL | Enum: `physical`, `online`, `hybrid`, `trial` |
| `location` | VARCHAR(500) | NULLABLE | Venue address; required when format = `physical` or `hybrid` |
| `category` | VARCHAR(100) | NOT NULL | Top-level category (see Category Reference below) |
| `subcategory` | VARCHAR(100) | NOT NULL | Sub-category under parent category |
| `tags` | TEXT[] / JSON | NULLABLE | e.g. `["Beginner Friendly", "Certification"]` |
| `feature_image_url` | VARCHAR(1000) | NULLABLE | URL of the starred/main thumbnail |
| `video_url` | VARCHAR(1000) | NULLABLE | YouTube or Instagram Reels embed URL |
| `cancellation_policy` | TEXT | NULLABLE | Free-text cancellation terms |
| `refund_policy` | TEXT | NULLABLE | Free-text refund terms |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT `draft` | Lifecycle status (see below) |
| `rejection_reason` | TEXT | NULLABLE | Admin rejection message |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `published_at` | TIMESTAMPTZ | NULLABLE | Set on status → `published` |

#### Status Enum

| Value | Meaning |
|---|---|
| `draft` | Saved locally, not submitted |
| `pending_review` | Submitted for admin approval |
| `published` | Live and visible |
| `rejected` | Rejected with reason |
| `archived` | Soft-deleted / taken offline |

---

### 2. `class_batches`

A class can have multiple concurrent batches (e.g. Morning, Afternoon, Weekend).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `class_id` | UUID / FK | NOT NULL, FK → `classes.id` ON DELETE CASCADE | Parent class |
| `name` | VARCHAR(100) | NOT NULL | Batch label, e.g. "Morning Batch" |
| `days` | TEXT[] / JSON | NOT NULL | Days of week: subset of `["M","T","W","Th","F","S","Su"]` |
| `start_time` | TIME | NOT NULL | Batch start time |
| `end_time` | TIME | NOT NULL | Batch end time |
| `max_capacity` | SMALLINT | NOT NULL, > 0 | Maximum number of students |
| `enrolled_count` | SMALLINT | NOT NULL, DEFAULT 0 | Current enrolled students (managed by booking system) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Toggle to pause a batch |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

### 3. `class_media`

Gallery photos and teaser videos for a class listing.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `class_id` | UUID / FK | NOT NULL, FK → `classes.id` ON DELETE CASCADE | Parent class |
| `media_type` | VARCHAR(10) | NOT NULL | Enum: `image`, `video` |
| `url` | VARCHAR(1000) | NOT NULL | CDN / S3 URL |
| `is_feature` | BOOLEAN | NOT NULL, DEFAULT FALSE | True for the starred thumbnail; unique per class |
| `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Sort order in gallery |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

### 4. `class_faqs`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / BIGSERIAL | PK | Primary key |
| `class_id` | UUID / FK | NOT NULL, FK → `classes.id` ON DELETE CASCADE | Parent class |
| `question` | VARCHAR(500) | NOT NULL | FAQ question |
| `answer` | TEXT | NOT NULL | FAQ answer |
| `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Display order |

---

## API Endpoints Required

### Classes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/classes/` | Create class (starts as `draft`) |
| `GET` | `/api/v1/classes/` | List all classes for the authenticated partner |
| `GET` | `/api/v1/classes/{id}/` | Full class detail (nested batches, media, faqs) |
| `PATCH` | `/api/v1/classes/{id}/` | Update class fields |
| `DELETE` | `/api/v1/classes/{id}/` | Soft-delete (set status to `archived`) |
| `POST` | `/api/v1/classes/{id}/submit/` | Submit for review |

### Batches

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/classes/{id}/batches/` | Add a batch |
| `PATCH` | `/api/v1/classes/{id}/batches/{bid}/` | Update a batch |
| `DELETE` | `/api/v1/classes/{id}/batches/{bid}/` | Remove a batch |

### Media

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/classes/{id}/media/` | Upload photo or video (multipart/form-data) |
| `PATCH` | `/api/v1/classes/{id}/media/{mid}/` | Set `is_feature`, update `display_order` |
| `DELETE` | `/api/v1/classes/{id}/media/{mid}/` | Delete media item |

### FAQs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/classes/{id}/faqs/` | Add FAQ |
| `PATCH` | `/api/v1/classes/{id}/faqs/{fid}/` | Edit FAQ |
| `DELETE` | `/api/v1/classes/{id}/faqs/{fid}/` | Delete FAQ |

---

## Request / Response Shapes

### `POST /api/v1/classes/` — Create Class

```json
{
  "title": "Advanced Robotics for Kids",
  "description": "Learn robotics from scratch...",
  "min_age": 8,
  "max_age": 14,
  "format": "physical",
  "location": "123 Tech Park, Andheri, Mumbai",
  "category": "Tech & Innovation",
  "subcategory": "Robotics",
  "tags": ["Beginner Friendly", "Certification"],
  "cancellation_policy": "Cancellations must be made 24 hours in advance...",
  "refund_policy": "No refunds after the first class...",
  "video_url": "https://youtube.com/watch?v=xxxx"
}
```

### `GET /api/v1/classes/{id}/` — Full Detail

```json
{
  "id": "uuid",
  "title": "Advanced Robotics for Kids",
  "description": "...",
  "min_age": 8,
  "max_age": 14,
  "format": "physical",
  "location": "123 Tech Park, Andheri",
  "category": "Tech & Innovation",
  "subcategory": "Robotics",
  "tags": ["Beginner Friendly", "Certification"],
  "feature_image_url": "https://cdn.tlb.in/classes/uuid/feature.jpg",
  "video_url": "https://youtube.com/...",
  "cancellation_policy": "...",
  "refund_policy": "...",
  "status": "published",
  "batches": [
    {
      "id": "uuid",
      "name": "Morning Batch",
      "days": ["M", "W", "F"],
      "start_time": "09:00",
      "end_time": "10:30",
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

| Category | Subcategories |
|---|---|
| Academic | School Subjects, Olympiad Preparation, Entrance Exam Preparation, Homework Support |
| Creative Arts | Painting, Pottery, Sketching, Clay Modelling, DIY Crafts, Origami, Sculpture, Calligraphy, Fashion Designing, Textile Art, Resin Art |
| Tech & Innovation | Coding, Robotics, Artificial Intelligence, Game Development, App Development, Web Development, Electronics, UI/UX Design, Cybersecurity |
| Performing Arts | Dance, Singing / Vocal Music, Instrument Learning, Theatre / Acting |
| Sports & Fitness | Football, Cricket, Basketball, Chess, Yoga, Martial Arts, Gymnastics, Skating, Pickle Ball, Golf, Hockey, Badminton, Tennis, Swimming |
| Speech & Communication | Public Speaking, Debate, Storytelling, Creative Writing, Spoken English, Foreign Languages, Indian Languages, Phonics |
| Life Skills & Personality Dev | Personality Development, Entrepreneurship, Financial Literacy, Emotional Intelligence |
| Creative Media | Photography, Video Creation, Graphic Design, Content Creation, Podcasting, Animation |
| Outdoor and Nature Learning | Gardening, Nature Exploration, Environmental Education, Adventure Skills, Wildlife Learning |
| Culinary | Cooking, Baking, Food Presentation & Styling |
| Brain Boosters | Abacus, Vedic Maths, Memory Skills, Problem Solving, Rubix Cube |

---

## Tag Reference

```
Beginner Friendly | Advanced | Certification | Weekend Only | Trial Available | Group Class | One-on-One
```

---

## Format Enum

| Label | DB Value | Location Required |
|---|---|---|
| Physical | `physical` | Yes |
| Online | `online` | No |
| Hybrid | `hybrid` | Yes |
| Trial | `trial` | No |

---

## Indexes

```sql
CREATE INDEX idx_classes_partner_id ON classes(partner_id);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_class_batches_class_id ON class_batches(class_id);
CREATE UNIQUE INDEX idx_class_media_feature ON class_media(class_id) WHERE is_feature = TRUE;
```

---

## Notes for the Backend Developer

1. **Partial saves:** Support `PATCH` with any subset of fields so the wizard can save progress at each step without requiring all fields.
2. **Submit validation:** On `POST .../submit/`, validate that `title`, `description`, `min_age`, `max_age`, `format`, `category`, `subcategory` are present and at least one `class_batch` exists. Return `400` with a list of missing fields.
3. **Feature image uniqueness:** Enforce max one `is_feature = TRUE` per class atomically.
4. **`enrolled_count`:** Managed by the booking/enquiry system — expose as read-only in class API responses.
5. **Partner scoping:** All endpoints must filter by `request.user.partner_id`.
6. **Class vs Program:** Classes and Programs share an identical wizard structure but have different category taxonomies and entity types. Keep them in separate tables to avoid discriminator complexity.
