# ARCHITECTURE.md — Reputation OS

## System Architecture Overview

Reputation OS is a multi-tenant SaaS platform using a monorepo architecture with a clear client-server separation.

```
┌─────────────────────────────────────────────────────────────┐
│                    Reputation OS Platform                     │
├──────────────────────┬──────────────────────────────────────┤
│   Frontend (SPA)     │         Backend (API)                 │
│   React + TS + Vite  │     Node.js + Express/Hono            │
│   Tailwind CSS       │     Drizzle ORM                       │
│                      │     PostgreSQL                        │
├──────────────────────┴──────────────────────────────────────┤
│                    Shared Types                              │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
reputation-os/
├── client/                    # Frontend SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Base design system components
│   │   │   ├── feedback/      # Feedback page components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   └── layout/        # Layout components
│   │   ├── pages/             # Route-level page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities, API client, helpers
│   │   ├── stores/            # State management
│   │   ├── types/             # Frontend-specific types
│   │   └── styles/            # Global styles, Tailwind config
│   ├── public/                # Static assets
│   ├── index.html
│   └── vite.config.ts
├── server/                    # Backend API
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Auth, tenant, rate-limit middleware
│   │   ├── services/          # Business logic
│   │   ├── db/                # Database schema, migrations, queries
│   │   │   ├── schema.ts      # Drizzle schema definitions
│   │   │   ├── migrations/    # SQL migration files
│   │   │   └── index.ts       # DB connection
│   │   ├── lib/               # Shared utilities
│   │   └── types/             # Server-specific types
│   └── tsconfig.json
├── shared/                    # Shared types and constants
│   ├── types/                 # Shared TypeScript types
│   └── constants/             # Shared constants
├── .env.example               # Environment variables template
├── package.json               # Root package.json
├── tsconfig.json              # Root TypeScript config
└── drizzle.config.ts          # Drizzle ORM config
```

## Multi-Tenancy Strategy

### Approach: Shared Database, Tenant-Scoped Queries

All businesses share a single PostgreSQL database. Tenant isolation is enforced through:

1. **Schema Design:** Every tenant-specific table includes a `business_id` foreign key
2. **Query Scoping:** All queries are automatically scoped by `business_id` via middleware
3. **Middleware Enforcement:** The `tenantMiddleware` extracts `business_id` from the authenticated session and injects it into the request context
4. **No Direct Table Access:** All data access goes through scoped query functions that require `business_id`

```typescript
// Every tenant query MUST include business_id
async function getFeedback(businessId: string, filters: FeedbackFilters) {
  return db.select()
    .from(feedback)
    .where(eq(feedback.businessId, businessId)) // ALWAYS scoped
    .where(/* additional filters */);
}
```

### Public Routes Exception

The customer feedback page (`/r/:businessSlug`) is a public route that:
- Resolves `businessSlug` to `business_id` server-side
- Only exposes public business data (name, logo, accent color, description)
- Never exposes private analytics, settings, or other business data

## Authentication & Authorization

### Authentication: Lucia Auth (or Better Auth)

- Session-based authentication
- Email/password registration and login
- Secure session cookies (httpOnly, secure, sameSite)
- CSRF protection
- Password hashing with Argon2

### Authorization Model

```
User → business_members → Business
         ↓
       role: owner | admin | member
```

- **Owner:** Full access, billing, delete business
- **Admin:** Manage settings, view all data, manage members
- **Member:** View dashboard, view feedback

### Middleware Stack

```
Request
  → rateLimiter
  → authMiddleware (verify session)
  → tenantMiddleware (resolve business_id, check membership)
  → roleMiddleware (check permission level)
  → Route Handler
```

## API Design

### API Structure

```
/api/v1/
├── auth/
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /logout
│   └── POST   /reset-password
├── business/
│   ├── GET    /profile
│   ├── PUT    /profile
│   ├── PUT    /settings
│   └── POST   /logo
├── feedback/
│   ├── GET    /                    # List (paginated, filtered)
│   ├── GET    /:id                 # Detail
│   ├── PATCH  /:id                 # Update (read status)
│   └── GET    /export              # Export CSV
├── sources/
│   ├── GET    /                    # List sources
│   ├── GET    /qr                  # Get QR code data
│   └── GET    /instagram           # Get Instagram link
├── analytics/
│   ├── GET    /overview            # Dashboard metrics
│   ├── GET    /funnel              # Funnel data
│   ├── GET    /trends              # Time-series trends
│   └── GET    /sources             # Source comparison
├── qr/
│   ├── GET    /generate            # Generate QR image
│   └── GET    /download/:format    # Download QR (png/svg)
└── reviews/
    └── GET    /settings            # Google review settings

/public/
├── GET    /r/:businessSlug         # Business info for feedback page
└── POST   /r/:businessSlug/feedback  # Submit feedback

/events/
└── POST   /track                   # Analytics event tracking
```

## Analytics Event Model

### Event Types

| Event | Trigger | Data |
|-------|---------|------|
| `feedback_page_view` | Page loads | source, businessId, sessionId |
| `rating_selected` | Star tapped | source, businessId, rating, sessionId |
| `feedback_started` | Text input begins | source, businessId, sessionId |
| `feedback_submitted` | Form submitted | source, businessId, rating, sessionId |
| `google_review_clicked` | CTA clicked | source, businessId, sessionId |

### Source Values

| Source | Origin |
|--------|--------|
| `reception` | QR code scan at business |
| `instagram` | Instagram bio/story link |
| `whatsapp` | Future: WhatsApp message link |
| `direct` | Direct URL access (fallback) |

### Privacy Constraints

- `sessionId` is a random UUID generated per visit, not linked to identity
- No cookies set on customer feedback pages (unless strictly necessary)
- No PII collected in analytics events
- IP addresses not stored in analytics events

## Customer Feedback Flow (Technical)

```
1. Customer scans QR / clicks Instagram link
   → GET /r/:businessSlug?source=reception
   
2. Frontend loads business branding
   → GET /public/r/:businessSlug
   → Returns: name, logo, accentColor, description
   → Track: feedback_page_view event

3. Customer selects rating
   → Track: rating_selected event (client-side)

4. Customer writes feedback
   → Track: feedback_started event (client-side, once)

5. Customer submits
   → POST /public/r/:businessSlug/feedback
   → Body: { rating, text, source, sessionId }
   → Server validates, stores feedback
   → Track: feedback_submitted event
   → Returns: { success, googleReviewUrl }

6. Google Review CTA displayed (ALL customers)
   → On click: Track google_review_clicked event
   → Redirect to business's Google review URL
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/reputation_os

# Auth
AUTH_SECRET=<random-secret-min-32-chars>
SESSION_EXPIRY=604800  # 7 days in seconds

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000/api/v1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
FEEDBACK_RATE_LIMIT_MAX=10  # per IP per window

# AI (Future)
# OPENAI_API_KEY=
# AI_MODEL=gpt-4o-mini

# WhatsApp (Future)
# WHATSAPP_API_KEY=
# WHATSAPP_PHONE_NUMBER_ID=

# Stripe (Future)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
```

## Security Architecture

### Input Validation
- All API inputs validated with Zod schemas
- Server-side validation on every endpoint
- Sanitize text inputs against XSS
- Parameterized queries only (Drizzle ORM prevents SQL injection)

### Rate Limiting
- Global rate limit: 100 req/15min per IP
- Feedback submission: 10 req/15min per IP
- Auth endpoints: 5 req/15min per IP
- Analytics events: 50 req/min per session

### Abuse Prevention
- Rate limiting on feedback submission
- Honeypot fields on feedback form
- Basic bot detection (timing-based)
- Feedback text length limits
- Session-based duplicate prevention

### Data Protection
- Passwords hashed with Argon2
- Sessions stored server-side
- HTTPS enforced in production
- Secure cookie flags (httpOnly, secure, sameSite=strict)
- CORS restricted to known origins
- No sensitive data in URL parameters
- Database connection over SSL in production

## Testing Strategy

### Layers

1. **Unit Tests** — Business logic, utilities, validation
   - Framework: Vitest
   - Target: 80% coverage on services and utilities

2. **Integration Tests** — API endpoints with database
   - Framework: Vitest + Supertest
   - Test database with migrations
   - Verify tenant isolation
   - Test auth flows

3. **E2E Tests** — Critical user flows (deferred to Phase 10)
   - Framework: Playwright
   - Customer feedback flow
   - Business signup → dashboard flow
   - QR generation and scanning

4. **Manual Testing Checklist**
   - Mobile feedback page on iOS Safari + Android Chrome
   - QR code scan from camera apps
   - Dashboard responsiveness

### Critical Test Scenarios

- Tenant A cannot access Tenant B's feedback
- Feedback submission stores correct source
- Google review CTA shown for ALL ratings (1-5)
- Rate limiting blocks excessive submissions
- Auth protects all dashboard routes
- Invalid business slug returns proper error
