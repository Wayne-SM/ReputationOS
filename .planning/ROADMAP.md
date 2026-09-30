# ROADMAP.md — Reputation OS

## Milestone: v1.0 — Core Platform

### Phase 1: Foundation & Project Setup

**Status:** Not Started  
**Objective:** Initialize the project with production-ready tooling, project structure, and development environment.

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

**Status:** Not Started  
**Objective:** Implement the complete database schema and full authentication flow with multi-tenant isolation.

**Requirements:** FR-001, FR-002  
**Dependencies:** Phase 1

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

**Status:** Not Started  
**Objective:** Build the public-facing branded feedback page — the core customer interaction.

**Requirements:** FR-003, FR-004  
**Dependencies:** Phase 2

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

**Status:** Not Started  
**Objective:** Implement QR code generation, source tracking for Reception QR and Instagram, and source management.

**Requirements:** FR-005, FR-006  
**Dependencies:** Phase 3

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

### Phase 5: Business Dashboard

**Status:** Not Started  
**Objective:** Build the main business dashboard with reputation overview, feedback management, and settings.

**Requirements:** FR-007, FR-008, FR-010  
**Dependencies:** Phase 4

**Scope:**
- Dashboard layout with sidebar navigation
- Reputation overview cards:
  - Google Rating (configured/manual initially)
  - Google Reviews count
  - New Reviews (period)
  - Feedback submissions count
- Source metrics: Reception QR scans, Instagram visits
- Google Activity: review CTA clicks
- Recent feedback list with filtering
- Rating distribution visualization
- Feedback detail view
- Business settings page:
  - Business profile (name, logo, color, description)
  - Google review URL configuration
  - Contact information
  - Feedback page preview
- Protected routes (auth required)
- Responsive dashboard for tablet/desktop

**Acceptance Criteria:**
- Dashboard loads in < 3s
- All metrics display correctly
- Feedback list paginates and filters properly
- Settings save and reflect on feedback page
- Logo upload works
- Dashboard only shows authenticated business's data
- Visual design matches premium direction (Linear/Stripe quality)

**Testing:**
- Dashboard API endpoint tests
- Metric calculation verification
- Settings CRUD tests
- Authorization tests (no cross-tenant access)
- Responsive layout testing

---

### Phase 6: Reputation Analytics

**Status:** Not Started  
**Objective:** Implement comprehensive analytics with funnel tracking, trends, and conversion metrics.

**Requirements:** FR-009  
**Dependencies:** Phase 5

**Scope:**
- Analytics event tracking implementation
  - feedback_page_view, rating_selected, feedback_started, feedback_submitted, google_review_clicked
- Funnel visualization (views → ratings → feedback → Google clicks)
- Conversion rate calculations
- Time-series analytics (daily, weekly, monthly)
- Source comparison analytics
- Reputation trend charts
- Analytics dashboard page
- Date range picker
- Export analytics data
- Privacy-conscious tracking (no unnecessary PII)

**Acceptance Criteria:**
- All funnel events tracked accurately
- Funnel visualization shows correct conversion rates
- Trends render correctly over selected time periods
- Source comparison shows reception vs instagram performance
- Analytics only accessible to authenticated business owner
- No unnecessary personal data collected

**Testing:**
- Event tracking accuracy tests
- Funnel calculation verification
- Date range filtering tests
- Privacy compliance check (no PII in events)

---

### Phase 7: AI Insights

**Status:** Not Started  
**Objective:** Add AI-powered review response suggestions, feedback summarization, and reputation insights.

**Requirements:** FR-011, FR-012  
**Dependencies:** Phase 6

**Scope:**
- Review response suggestion engine
- Customer feedback theme extraction
- Sentiment analysis across feedback
- Monthly reputation summary generation
- Actionable business insights
- AI insights dashboard page
- AI output clearly marked as suggestions/assistance
- Rate limiting on AI calls

**Acceptance Criteria:**
- Response suggestions are contextually relevant
- Feedback themes accurately reflect patterns
- Sentiment analysis produces meaningful results
- Monthly summaries cover key metrics and trends
- AI output clearly labeled as AI-generated suggestions
- AI features do not block core functionality if unavailable

**Testing:**
- AI response quality validation
- Sentiment accuracy benchmarks
- Graceful degradation when AI unavailable
- Rate limit enforcement

---

### Phase 8: WhatsApp Integration

**Status:** Not Started  
**Objective:** Add WhatsApp-based review request automation as a third acquisition channel.

**Requirements:** FR-013  
**Dependencies:** Phase 6

**Scope:**
- WhatsApp Business API integration
- Message template management
- Customer visit → WhatsApp message → feedback URL flow
- WhatsApp as tracked source
- Opt-in/consent management
- Message delivery tracking
- WhatsApp analytics in dashboard

**Acceptance Criteria:**
- WhatsApp messages send successfully via Business API
- Feedback URL in message tracks source=whatsapp
- Customer consent properly managed
- Delivery status tracked
- WhatsApp metrics appear in dashboard

**Testing:**
- WhatsApp API integration tests
- Message delivery verification
- Source tracking for WhatsApp channel
- Consent flow testing

---

### Phase 9: Billing & SaaS Plans

**Status:** Not Started  
**Objective:** Implement subscription billing, plan management, and usage tracking.

**Requirements:** FR-015  
**Dependencies:** Phase 5

**Scope:**
- Subscription plans definition (Free, Pro, Business)
- Payment integration (Stripe)
- Plan selection and upgrade/downgrade
- Usage tracking and limits
- Billing dashboard
- Invoice generation
- Trial period management
- Plan-based feature gating

**Acceptance Criteria:**
- Users can subscribe to plans
- Payments process correctly via Stripe
- Usage limits enforced per plan
- Upgrade/downgrade works smoothly
- Invoices generated and accessible
- Trial period functions correctly

**Testing:**
- Stripe integration tests (test mode)
- Plan switching tests
- Usage limit enforcement tests
- Billing calculation accuracy

---

### Phase 10: Security, Testing & Production Hardening

**Status:** Not Started  
**Objective:** Comprehensive security audit, test coverage, performance optimization, and production deployment readiness.

**Requirements:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-005, NFR-006  
**Dependencies:** Phase 1–9

**Scope:**
- Security audit and penetration testing
- Tenant isolation verification
- Rate limiting review and hardening
- Input sanitization audit
- CSRF/XSS protection verification
- API security headers
- Database query optimization
- Performance benchmarking
- Error monitoring setup
- Logging and audit trail
- Backup and recovery procedures
- CI/CD pipeline
- Production deployment configuration
- Load testing
- Documentation finalization

**Acceptance Criteria:**
- No critical/high security vulnerabilities
- Tenant isolation verified under adversarial testing
- All rate limits functioning
- Performance meets NFR targets
- CI/CD pipeline deploys successfully
- Monitoring and alerting operational
- Backup/restore tested
- Production environment stable

**Testing:**
- Security scan (automated + manual)
- Load testing results
- Tenant isolation adversarial tests
- Full regression test suite
- Backup/restore drill
