# REQUIREMENTS.md — Reputation OS

## Functional Requirements

### FR-001: Multi-Tenant Architecture
- Platform must support multiple isolated businesses
- Each business has its own data, settings, and branding
- No cross-tenant data leakage
- Tenant isolation at database level (shared DB, tenant-scoped queries)

### FR-002: Business Registration & Authentication
- Business owners can sign up and create an account
- Secure login with email/password
- Session management
- Password reset flow
- Business profile management (name, logo, brand color, description, contact info)

### FR-003: Customer Feedback Experience
- Public feedback page accessible via `/r/:businessSlug`
- Mobile-first, fast-loading, premium design
- Branded per business (logo, accent color, business name)
- Star rating selection (1-5)
- Text feedback input
- No customer account required
- Feedback submission without page reload
- **NO review gating** — Google review CTA shown to ALL customers regardless of rating

### FR-004: Google Review CTA
- After feedback submission, show Google review call-to-action
- CTA links to business's configured Google review URL
- Shown to ALL customers regardless of rating (no gating)
- Track CTA clicks with source, timestamp, business context
- Do not claim clicking guarantees a review

### FR-005: Review Source Tracking
- Two sources: Reception QR and Instagram
- Each business gets one Reception QR code and one Instagram link
- Both lead to same feedback experience
- Source tracked on every feedback submission and analytics event
- Source identifiable via URL parameter or distinct route

### FR-006: QR Code Generation
- Generate branded QR code for each business
- QR encodes the business feedback URL with source=reception
- Downloadable in print-ready formats
- QR management page in dashboard

### FR-007: Business Dashboard (MVP Scope)
- Essential metrics overview:
  1. Reception QR scans
  2. Instagram visits
  3. Feedback submissions count
  4. Google review CTA clicks
  5. Rating distribution (1–5 stars)
  6. Total feedback count
  7. Basic recent customer feedback list
- Filter feedback by source (reception vs instagram) and rating
- Minimalist, high-density SaaS design (inspired by Linear/Stripe/Apple)
- Zero bloated cards or vanity metrics

### FR-008: Feedback Management
- View all customer feedback
- Filter by source, rating, date
- Search feedback text
- Mark feedback as read/unread
- Export feedback data

### FR-009: Lightweight First-Party Analytics (MVP Scope)
- First-party telemetry stored in existing `analytics_events` table (no paid analytics tools)
- Tracks: `feedback_page_view`, `rating_selected`, `feedback_submitted`, `google_review_clicked`
- Source tracking (`reception`, `instagram`)
- Postponed: cohort analysis, complex multi-step historical funnels, automated PDF generation

### FR-010: Business Settings
- Configure business name, logo, brand accent color
- Configure business description
- Configure Google review URL
- Configure contact information & feedback page appearance

### FR-011: Provider Abstraction: AI Insights (Post-MVP)
- Pluggable `IAiProvider` interface with default `NoOpAiProvider` (₹0 cost)
- Ready for future OpenAI/Anthropic/Gemini integration without modifying domain code
- Postponed from MVP

### FR-012: Provider Abstraction: Messaging & WhatsApp (Post-MVP)
- Pluggable `IMessagingProvider` interface with default `ConsoleMessagingProvider` (₹0 cost)
- Ready for future WhatsApp Business API / Twilio integration
- Postponed from MVP

### FR-013: Provider Abstraction: Billing & Subscriptions (Post-MVP)
- Pluggable `IBillingProvider` interface with default `FreeTierBillingProvider` (₹0 cost)
- Ready for future Stripe integration
- Postponed from MVP

### FR-014: Marketing Website
- Landing page with value proposition
- Features page
- How it works explanation
- Pricing page
- FAQ
- Login/signup CTAs
- Deferred — product first

### FR-015: Billing & Subscriptions (Future)
- SaaS subscription plans
- Billing management
- Usage tracking
- Deferred to Phase 9

## Non-Functional Requirements

### NFR-001: Performance
- Customer feedback page loads in < 2 seconds on 3G
- Dashboard loads in < 3 seconds
- API response times < 500ms for standard operations
- QR code generation < 1 second

### NFR-002: Security
- Tenant data isolation enforced at query level
- Server-side input validation on all endpoints
- Rate limiting on public endpoints (feedback submission, page views)
- Abuse prevention for spam/fake feedback
- Secure environment variables management
- Input sanitization against XSS/injection
- HTTPS enforced
- Authentication tokens with proper expiry
- No private business data exposed via client-side queries

### NFR-003: Privacy
- Collect only necessary data
- Feedback can be anonymous unless business opts for contact collection
- No unnecessary personal information in analytics events
- Privacy-compliant analytics tracking
- Clear data handling policies

### NFR-004: Scalability
- Multi-tenant architecture supports growing number of businesses
- Database designed for horizontal scaling path
- Stateless API design for load balancing

### NFR-005: Usability
- Customer feedback page: zero learning curve
- Business dashboard: understandable by non-technical business owners
- Mobile-responsive across all interfaces
- Accessible (WCAG 2.1 AA baseline)

### NFR-006: Reliability
- Feedback submissions must not be lost
- Graceful error handling on all user-facing pages
- Database backup strategy

## Constraints
 
 - **C-001:** No review gating — all customers see Google review CTA
 - **C-002:** Only two review sources: Reception QR and Instagram
 - **C-003:** No Google API text injection — use redirect URL only
 - **C-004:** No WhatsApp sending in initial implementation
 - **C-005:** AI features deferred to later phases
 - **C-006:** No unnecessary dependencies
 - **C-007:** Product before marketing site
+- **C-008:** **₹0 Infrastructure Cost Baseline:** Prioritize free/open-source infrastructure and free tiers. Zero paid APIs, paid SaaS dependencies, paid AI, paid messaging, or external analytics in MVP.
+- **C-009:** **First-Party Lightweight Analytics:** Store all telemetry events in the existing PostgreSQL database. No external trackers.
+- **C-010:** **Lean MVP Metric Set:** The MVP dashboard only renders: Reception QR scans, Instagram visits, Feedback submissions, Google review CTA clicks, Rating distribution, Total feedback, and Basic recent feedback.
+- **C-011:** **Provider Abstractions for Deferred Features:** AI, WhatsApp, Stripe, and Email services must be architected behind clean provider interfaces with default ₹0/NoOp implementations to prevent rewrites when scaling.
