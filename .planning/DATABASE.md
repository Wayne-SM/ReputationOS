---

# DATABASE.md — Reputation OS

## Schema Overview

PostgreSQL database with tenant-scoped tables. All tenant-specific tables include a `business_id` foreign key for isolation.

## Entity Relationship Diagram

```
users ──────┐
            ├── business_members ──── businesses
            │                           ├── business_settings
            │                           ├── review_sources
            │                           │     └── qr_codes
            │                           ├── feedback
            │                           │     └── feedback_responses
            │                           ├── analytics_events
            │                           ├── google_review_settings
            │                           ├── monthly_reports
            │                           └── subscriptions
```

## Table Definitions

### users

Platform-level user accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | User ID |
| email | varchar(255) | UNIQUE, NOT NULL | Email address |
| password_hash | varchar(255) | NOT NULL | Argon2 hashed password |
| name | varchar(255) | NOT NULL | Display name |
| email_verified | boolean | DEFAULT false | Email verification status |
| created_at | timestamptz | DEFAULT NOW() | Account creation |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:** `idx_users_email` on `email`

### businesses

Tenant entity — each business is an isolated tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Business ID |
| name | varchar(255) | NOT NULL | Business name |
| slug | varchar(100) | UNIQUE, NOT NULL | URL-safe identifier (for /r/:slug) |
| description | text | | Business description |
| logo_url | varchar(500) | | Logo image URL |
| accent_color | varchar(7) | DEFAULT '#2563eb' | Brand accent color (hex) |
| phone | varchar(20) | | Contact phone |
| email | varchar(255) | | Contact email |
| address | text | | Business address |
| website | varchar(500) | | Business website |
| timezone | varchar(50) | DEFAULT 'UTC' | Business timezone |
| is_active | boolean | DEFAULT true | Active status |
| created_at | timestamptz | DEFAULT NOW() | Creation date |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:** `idx_businesses_slug` on `slug`, `idx_businesses_is_active` on `is_active`

### business_members

Join table linking users to businesses with roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Membership ID |
| user_id | uuid | FK → users.id, NOT NULL | User reference |
| business_id | uuid | FK → businesses.id, NOT NULL | Business reference |
| role | varchar(20) | NOT NULL, CHECK (role IN ('owner', 'admin', 'member')) | Member role |
| created_at | timestamptz | DEFAULT NOW() | Join date |

**Indexes:** `idx_bm_user_business` UNIQUE on `(user_id, business_id)`, `idx_bm_business` on `business_id`

### business_settings

Extended settings per business.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Settings ID |
| business_id | uuid | FK → businesses.id, UNIQUE, NOT NULL | Business reference |
| feedback_welcome_text | text | DEFAULT 'How was your experience?' | Feedback page heading |
| feedback_thank_you_text | text | DEFAULT 'Thank you for your feedback!' | Post-submission message |
| google_review_cta_text | text | DEFAULT 'Share your experience on Google' | CTA button text |
| collect_contact_info | boolean | DEFAULT false | Whether to ask for contact info |
| contact_info_required | boolean | DEFAULT false | Whether contact info is mandatory |
| notify_on_feedback | boolean | DEFAULT true | Email notification on new feedback |
| notify_on_low_rating | boolean | DEFAULT true | Alert on ratings ≤ 2 |
| low_rating_threshold | integer | DEFAULT 2 | Rating threshold for alerts |
| created_at | timestamptz | DEFAULT NOW() | Creation date |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:** `idx_bs_business` on `business_id`

### google_review_settings

Google review configuration per business.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Settings ID |
| business_id | uuid | FK → businesses.id, UNIQUE, NOT NULL | Business reference |
| google_place_id | varchar(255) | | Google Place ID (optional) |
| google_review_url | varchar(500) | | Direct Google review URL |
| google_rating | decimal(2,1) | | Current Google rating (manual/cached) |
| google_review_count | integer | DEFAULT 0 | Review count (manual/cached) |
| last_synced_at | timestamptz | | Last rating/count sync |
| created_at | timestamptz | DEFAULT NOW() | Creation date |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:** `idx_grs_business` on `business_id`

### review_sources

Configured feedback acquisition sources per business.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Source ID |
| business_id | uuid | FK → businesses.id, NOT NULL | Business reference |
| type | varchar(20) | NOT NULL, CHECK (type IN ('reception', 'instagram', 'whatsapp', 'direct')) | Source type |
| label | varchar(100) | NOT NULL | Display label |
| is_active | boolean | DEFAULT true | Active status |
| url | varchar(500) | | Generated tracking URL |
| created_at | timestamptz | DEFAULT NOW() | Creation date |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:** `idx_rs_business` on `business_id`, `idx_rs_business_type` UNIQUE on `(business_id, type)`

### qr_codes

QR code metadata linked to review sources.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | QR ID |
| source_id | uuid | FK → review_sources.id, UNIQUE, NOT NULL | Source reference |
| business_id | uuid | FK → businesses.id, NOT NULL | Business reference (denormalized for queries) |
| qr_data | text | NOT NULL | Encoded URL in QR |
| style_config | jsonb | DEFAULT '{}' | QR visual customization |
| created_at | timestamptz | DEFAULT NOW() | Creation date |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:** `idx_qr_business` on `business_id`, `idx_qr_source` on `source_id`

### feedback

Customer feedback submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Feedback ID |
| business_id | uuid | FK → businesses.id, NOT NULL | Business reference |
| source_type | varchar(20) | NOT NULL | Source: reception, instagram, whatsapp, direct |
| session_id | uuid | NOT NULL | Anonymous session identifier |
| rating | integer | NOT NULL, CHECK (rating BETWEEN 1 AND 5) | Star rating |
| text | text | | Feedback text content |
| customer_name | varchar(255) | | Optional customer name |
| customer_email | varchar(255) | | Optional customer email |
| customer_phone | varchar(20) | | Optional customer phone |
| is_read | boolean | DEFAULT false | Read status |
| google_review_clicked | boolean | DEFAULT false | Whether CTA was clicked |
| ip_hash | varchar(64) | | Hashed IP for rate limiting (not stored as PII) |
| user_agent | varchar(500) | | Browser user agent |
| created_at | timestamptz | DEFAULT NOW() | Submission timestamp |

**Indexes:** `idx_fb_business` on `business_id`, `idx_fb_business_created` on `(business_id, created_at DESC)`, `idx_fb_business_source` on `(business_id, source_type)`, `idx_fb_business_rating` on `(business_id, rating)`

### feedback_responses

Business responses to customer feedback (for AI-assisted review responses).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Response ID |
| feedback_id | uuid | FK → feedback.id, NOT NULL | Feedback reference |
| business_id | uuid | FK → businesses.id, NOT NULL | Business reference |
| response_text | text | NOT NULL | Response content |
| is_ai_generated | boolean | DEFAULT false | AI-generated flag |
| is_sent | boolean | DEFAULT false | Whether sent/published |
| created_by | uuid | FK → users.id | User who created/approved |
| created_at | timestamptz | DEFAULT NOW() | Creation date |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:** `idx_fr_feedback` on `feedback_id`, `idx_fr_business` on `business_id`

### analytics_events

Funnel and engagement event tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Event ID |
| business_id | uuid | FK → businesses.id, NOT NULL | Business reference |
| event_type | varchar(50) | NOT NULL | Event name |
| source_type | varchar(20) | NOT NULL | Source: reception, instagram, whatsapp, direct |
| session_id | uuid | | Anonymous session ID |
| metadata | jsonb | DEFAULT '{}' | Additional event data |
| created_at | timestamptz | DEFAULT NOW() | Event timestamp |

**Event types:** feedback_page_view, rating_selected, feedback_started, feedback_submitted, google_review_clicked

**Indexes:** `idx_ae_business` on `business_id`, `idx_ae_business_type` on `(business_id, event_type)`, `idx_ae_business_created` on `(business_id, created_at DESC)`, `idx_ae_business_source` on `(business_id, source_type)`

### monthly_reports

Generated monthly reputation reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Report ID |
| business_id | uuid | FK → businesses.id, NOT NULL | Business reference |
| month | date | NOT NULL | Report month (first day of month) |
| report_data | jsonb | NOT NULL | Full report content |
| ai_summary | text | | AI-generated summary |
| created_at | timestamptz | DEFAULT NOW() | Generation date |

**Indexes:** `idx_mr_business_month` UNIQUE on `(business_id, month)`

### subscriptions

SaaS subscription tracking (table created early, logic deferred).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Subscription ID |
| business_id | uuid | FK → businesses.id, UNIQUE, NOT NULL | Business reference |
| plan | varchar(20) | NOT NULL, DEFAULT 'free' | Plan: free, pro, business |
| status | varchar(20) | NOT NULL, DEFAULT 'active' | Status: active, cancelled, past_due |
| stripe_customer_id | varchar(255) | | Stripe customer ID |
| stripe_subscription_id | varchar(255) | | Stripe subscription ID |
| current_period_start | timestamptz | | Billing period start |
| current_period_end | timestamptz | | Billing period end |
| created_at | timestamptz | DEFAULT NOW() | Creation date |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:** `idx_sub_business` on `business_id`, `idx_sub_stripe_customer` on `stripe_customer_id`

### sessions

Lucia Auth session storage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar(255) | PK | Session ID |
| user_id | uuid | FK → users.id, NOT NULL | User reference |
| expires_at | timestamptz | NOT NULL | Session expiry |

**Indexes:** `idx_sessions_user` on `user_id`

## Migration Strategy

- Use Drizzle Kit for schema migrations
- Migrations stored in `server/src/db/migrations/`
- All migrations are forward-only in production
- Development: `drizzle-kit push` for rapid iteration
- Production: `drizzle-kit generate` → review → `drizzle-kit migrate`

## Normalization Notes

1. `business_id` is denormalized on `qr_codes` and `feedback_responses` to avoid joins for common tenant-scoped queries
2. `source_type` is denormalized on `feedback` and `analytics_events` for query performance (avoids joining to `review_sources` on every read)
3. `google_rating` and `google_review_count` on `google_review_settings` are cached values — the source of truth is Google's platform

## Data Retention

- Feedback: retained indefinitely (business asset)
- Analytics events: 24-month rolling window (can be aggregated)
- Sessions: cleaned up on expiry
- Monthly reports: retained indefinitely
