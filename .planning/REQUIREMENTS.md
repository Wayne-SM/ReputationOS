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

### FR-007: Business Dashboard
- Reputation overview: Google rating, review count, new reviews, feedback count
- Source metrics: Reception QR scans, Instagram visits
- Google activity: review CTA clicks
- Conversion/funnel metrics
- Recent customer feedback list
- Rating distribution chart
- Reputation trends over time
- Meaningful visual hierarchy, not excessive cards

### FR-008: Feedback Management
- View all customer feedback
- Filter by source, rating, date
- Search feedback text
- Mark feedback as read/unread
- Export feedback data

### FR-009: Analytics & Funnel Tracking
- Track events: page_view, rating_selected, feedback_started, feedback_submitted, google_review_clicked
- Track source per event: reception, instagram
- Funnel visualization: views → ratings → feedback → Google clicks
- Time-based analytics (daily, weekly, monthly)
- Privacy-conscious (no unnecessary PII collection)

### FR-010: Business Settings
- Configure business name, logo, brand accent color
- Configure business description
- Configure Google review URL
- Configure contact information
- Manage QR code settings
- Configure feedback page appearance

### FR-011: Review Response Assistance (AI — Future)
- Suggest review responses based on feedback content
- AI output presented as suggestions, not authoritative decisions
- Deferred to Phase 7

### FR-012: Customer Feedback Summarization (AI — Future)
- Summarize feedback themes and patterns
- Sentiment analysis across feedback
- Monthly reputation summary generation
- Actionable business insights
- Deferred to Phase 7

### FR-013: WhatsApp Integration (Future)
- Send review request messages via WhatsApp
- Architecture must support adding this later
- Do not fake WhatsApp in initial implementation
- Deferred to Phase 8

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
