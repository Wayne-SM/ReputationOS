# ROADMAP.md — Reputation OS

## Milestone: v1.0 — Lean MVP (₹0 Infrastructure Cost)

## Phases

- [x] **Phase 1: Foundation & Project Setup** - Scaffolding, monorepo, 13-table schema, dev environment
- [x] **Phase 2: Database Schema & Authentication** - Multi-tenant isolation, user/business registration, sessions, auth middleware
- [x] **Phase 3: Customer Feedback Experience** - Public branded feedback page, star rating, universal Google review CTA
- [x] **Phase 4: QR Code & Source Tracking** - Print-ready Reception QR and Instagram link generation and tracking (Zero Cost)
- [x] **Phase 5: Lean Business Dashboard** - The 7 essential MVP metrics, recent feedback, and business settings (Zero Cost)
- [x] **Phase 6: Provider Abstractions & Extensibility** - Pluggable provider interfaces for AI, WhatsApp, Stripe, and Email (No-Op fallbacks)
- [ ] **Phase 7: AI Insights** - (POST-MVP / Postponed)
- [ ] **Phase 8: WhatsApp Integration** - (POST-MVP / Postponed)
- [ ] **Phase 9: Billing & SaaS Plans** - (POST-MVP / Postponed)
- [x] **Phase 10: Production Hardening & Scalability** - Deployment configuration for free-tier cloud environments

---

### Phase 1: Foundation & Project Setup

**Status:** Complete  
**Goal:** Initialize the project with production-ready tooling, project structure, and development environment.
**Depends on:** Nothing (first phase)
**Plans:** 1 plan

Plans:
- [x] 01-01: Foundation & Project Setup Scaffolding

**Requirements:** FR-001 (partial)  
**Dependencies:** None

**Scope:**
- Initialize monorepo with React + TypeScript + Vite frontend
- Set up Tailwind CSS with design system tokens
- Set up Express/Fastify backend with TypeScript
- Configure PostgreSQL connection with Drizzle ORM
- Set up authentication scaffolding (Lucia Auth or similar)
- Environment variables configuration
- ESLint, Prettier, project structure
- Development scripts (dev, build, lint)
- Basic health check endpoint
- Git configuration and initial commit

**Acceptance Criteria:**
- `npm run dev` starts both frontend and backend
- Backend health endpoint returns 200
- Database connection verified
- TypeScript compiles without errors
- Tailwind CSS renders correctly
- Auth library initialized

**Testing:**
- Health check endpoint test
- Build succeeds without errors
- TypeScript type checking passes

---

### Phase 2: Database Schema & Authentication

**Status:** Complete  
**Goal:** Implement the complete database schema and full authentication flow with multi-tenant isolation.
**Depends on:** Phase 1
**Requirements:** FR-001, FR-002
**Success Criteria** (what must be TRUE):
  1. User registration creates user, business, business membership (owner), settings, and review sources in an atomic flow
  2. User can log in and receives an httpOnly session cookie
  3. Protected routes enforce authentication and reject invalid or expired sessions
  4. Tenant isolation middleware derives business context strictly from session, rejecting unauthorized cross-tenant access
  5. Password hashing uses crypto.scrypt with individual salt and timing-safe comparison
**Plans:** 1 plan

Plans:
- [x] 02-01: Multi-tenant database operations, auth service, session management, auth routes, and tenant middleware

**Scope:**
- Design and implement normalized database schema
  - users, businesses, business_members, business_settings
  - review_sources, qr_codes, feedback, feedback_events
  - google_review_settings, analytics_events
  - subscriptions (table only, logic deferred)
- Implement tenant isolation (all queries scoped by business_id)
- User registration flow (email/password)
- User login flow with session management
- Password reset flow
- Business creation during signup
- Business member roles (owner, admin, member)
- Protected route middleware
- Auth context in frontend

**Acceptance Criteria:**
- All tables created with proper relations and indexes
- User can register, login, logout
- Password reset sends email (or mock in dev)
- All database queries enforce business_id scoping
- No cross-tenant data access possible
- Session persists across page refreshes
- Role-based access control functional

**Testing:**
- Schema migration runs cleanly
- Auth flow integration tests
- Tenant isolation verification (query scoping)
- Input validation tests

---

### Phase 3: Customer Feedback Experience

**Status:** Complete  
**Goal:** Build the public-facing branded feedback page — the core customer interaction.
**Depends on:** Phase 2
**Requirements:** FR-003, FR-004
**Success Criteria** (what must be TRUE):
  1. Public route /r/:businessSlug loads business branding (name, logo, accent color, description) quickly without auth
  2. Mobile-first interactive 5-star rating selector with smooth tactile selection
  3. Customer feedback submission captures rating, feedback text, source attribution (reception/instagram), and anonymous sessionId
  4. Universal Google Review CTA is shown to ALL customers regardless of star rating (strict no-gating policy)
  5. CTA click records google_review_clicked event and navigates to business's Google review URL
  6. Rate limiting and honeypot protect feedback endpoint from automated spam
**Plans:** 1 plan

Plans:
- [x] 03-01: Public business branding endpoint, feedback submission API with click tracking, and mobile-first branded feedback UX

**Scope:**
- Public route: `/r/:businessSlug`
- Fetch business branding (name, logo, accent color, description)
- Star rating component (1-5, interactive, mobile-optimized)
- Feedback text input
- Feedback submission API endpoint
- Google review CTA after submission (shown to ALL customers)
- Google review URL redirect with click tracking
- Success/thank you state
- Error handling and loading states
- Mobile-first responsive design
- Premium, branded visual design
- Rate limiting on feedback submission
- Basic spam prevention

**Acceptance Criteria:**
- Page loads in < 2s on 3G
- Rating selection is smooth and tactile on mobile
- Feedback submits successfully and stores in database
- Google review CTA appears for ALL ratings (1-5)
- CTA click tracked in analytics_events
- Business branding (logo, colors) renders correctly
- Page works on iOS Safari, Android Chrome
- No customer account required
- Rate limiting prevents spam submissions

**Testing:**
- Feedback submission API tests
- CTA click tracking verification
- Mobile responsiveness visual testing
- Rate limit enforcement test
- Cross-browser testing checklist

---

### Phase 4: QR Code & Source Tracking

**Status:** Complete  
**Goal:** Implement server-side print-ready QR code generation, source tracking for Reception QR and Instagram, and dashboard source management at ₹0 infrastructure cost.
**Depends on:** Phase 3
**Requirements:** FR-005, FR-006, C-008
**Success Criteria** (what must be TRUE):
  1. Server generates high-resolution PNG (1024x1024) and vector SVG QR codes in-process with zero external API calls
  2. Reception QR encodes the canonical feedback URL with ?source=reception
  3. Instagram source generator provides the canonical link with ?source=instagram
  4. Authenticated business owner can download print-ready PNG and vector SVG QR assets
  5. One-click copy interaction allows easy deployment of the Instagram bio link
  6. Source attribution is strictly recorded on feedback submissions and telemetry events
**Plans:** 1 plan

Plans:
- [x] 04-01: In-process QR code generator (PNG/SVG), authenticated sources API, print-ready download endpoints, and dashboard sources UI

**Scope:**
- QR code generation for business feedback URL
- Source parameter encoding (source=reception, source=instagram)
- Instagram link generation with source tracking
- Source stored with every feedback submission
- Source stored with every analytics event
- QR code download (PNG, SVG)
- QR management page in dashboard
- Instagram link copy/share functionality
- review_sources table management

**Acceptance Criteria:**
- QR code scans lead to correct feedback page with source=reception
- Instagram link leads to feedback page with source=instagram
- Source correctly recorded on all feedback and events
- QR downloadable in print-ready quality
- Dashboard shows QR code and Instagram link
- Source analytics distinguish reception vs instagram

**Testing:**
- QR code scan verification
- Source parameter propagation tests
- Download format verification
- Analytics source attribution tests

---

### Phase 5: Lean Business Dashboard (MVP Scope)

**Status:** Complete  
**Goal:** Build the focused business dashboard with the 7 essential MVP metrics, recent customer feedback, and business settings.
**Depends on:** Phase 4
**Requirements:** FR-007, FR-008, FR-010, C-008, C-010
**Success Criteria** (what must be TRUE):
  1. Business dashboard loads in < 1 second using direct database aggregation (₹0 external analytics)
  2. The 7 essential MVP metrics display accurately: Reception QR scans, Instagram visits, Feedback submissions, Google review CTA clicks, Rating distribution (1-5), Total feedback, and Recent feedback list
  3. Feedback table displays customer rating, source badge (Reception/Instagram), timestamp, and text
  4. Business settings allow updating business name, accent color, and Google Review URL
  5. Cross-tenant isolation is strictly preserved in all dashboard queries
**Plans:** 1 plan

Plans:
- [x] 05-01: Essential metrics API, feedback list with filters, business settings form, and premium dashboard UI

---

### Phase 6: Provider Abstractions & Extensibility

**Status:** Complete  
**Goal:** Implement clean provider interfaces for postponed external services (AI, WhatsApp, Billing, Email) with default ₹0/No-Op local providers so features can be plugged in later without major rewrites.
**Depends on:** Phase 5
**Requirements:** FR-011, FR-012, FR-013, C-008, C-011
**Success Criteria** (what must be TRUE):
  1. IAiProvider interface created with NoOpAiProvider (returns structured fallback or empty suggestion)
  2. IMessagingProvider interface created with ConsoleMessagingProvider (logs formatted message to console at ₹0 cost)
  3. IBillingProvider interface created with FreeTierBillingProvider (manages active free status without Stripe dependencies)
  4. IEmailProvider interface created with ConsoleEmailProvider (logs password reset / notification events at ₹0 cost)
  5. Provider factory resolves implementations via environment variables without touching domain logic
**Plans:** 1 plan

Plans:
- [x] 06-01: Provider interfaces, factory resolution, and No-Op/local implementations for AI, WhatsApp, Stripe, and Email

---

### Phase 7: AI Insights (POST-MVP / Postponed)

**Status:** Deferred  
**Objective:** Add AI-powered review response suggestions and sentiment analysis using pluggable AI provider.
**Dependencies:** Phase 6

---

### Phase 8: WhatsApp Integration (POST-MVP / Postponed)

**Status:** Deferred  
**Objective:** Add WhatsApp Business automated review request flows using pluggable messaging provider.
**Dependencies:** Phase 6

---

### Phase 9: Billing & SaaS Plans (POST-MVP / Postponed)

**Status:** Deferred  
**Objective:** Add Stripe subscription billing using pluggable billing provider.
**Dependencies:** Phase 6

---

### Phase 10: Production Hardening & Scalability

**Status:** Complete  
**Goal:** Free-tier deployment guides (Render / Vercel / Supabase), security checklist verification, and final regression testing.
**Depends on:** Phase 1–6
**Plans:** 1 plan

Plans:
- [x] 10-01: Zero-cost deployment runbook, Docker containerization, static routing rules, and monorepo verification

