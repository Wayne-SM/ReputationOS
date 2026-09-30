# Phase 5 Context: Lean Business Dashboard (MVP Scope)

## User Intent & Requirements
- **Milestone:** v1.0 — Lean MVP (₹0 Infrastructure Cost)
- **Goal:** Deliver a focused, lightning-fast business dashboard providing local business owners with actionable reputation insights and essential metrics without external paid analytics.

## Strict MVP Constraints
1. **₹0 Infrastructure Cost Baseline:**
   - Must operate at ₹0 cost during early-stage testing.
   - Rely strictly on lightweight first-party event tracking stored in the existing PostgreSQL database (`analytics_events` and `feedback` tables).
   - Zero paid APIs, zero third-party analytics platforms (no Mixpanel, PostHog, Segment, Google Analytics, etc.).

2. **The 7 Essential MVP Metrics (Strict Scope):**
   - **Reception QR scans**: `COUNT(*)` of `analytics_events` where `eventType = 'feedback_page_view'` and `sourceType = 'reception'`.
   - **Instagram visits**: `COUNT(*)` of `analytics_events` where `eventType = 'feedback_page_view'` and `sourceType = 'instagram'`.
   - **Feedback submissions**: `COUNT(*)` of customer feedback submissions (`feedback` table or `eventType = 'feedback_submitted'`).
   - **Google review CTA clicks**: `COUNT(*)` of `analytics_events` where `eventType = 'google_review_clicked'` (or `feedback.googleReviewClicked = true`).
   - **Rating distribution**: Breakdown of ratings 1 through 5 (count and percentage of total feedback).
   - **Total feedback**: Total count of all feedback received for this business.
   - **Basic recent feedback**: Chronological list of recent feedback submissions with rating, source badge (Reception / Instagram), customer name/text, and timestamp.

3. **Deferred / Excluded from MVP:**
   - Advanced historical analytics & time-series charting
   - Cohort analysis
   - Advanced conversion funnels
   - Automated email/PDF reports
   - Expensive AI sentiment processing / auto-replies (deferred to Phase 7)

4. **Business Settings & Tenant Management:**
   - Ability for business owner/admin to view and update business profile (name, accent color) and Google Review settings (`googleReviewUrl`).
   - Strictly scoped by tenant (`business_id`) derived from session.

5. **Design & UX Guidelines:**
   - High-density, minimal, Linear/Stripe-inspired interface.
   - Fast loading (< 1s query execution).
   - Star rating breakdown with visual progress bars.
   - Filterable recent feedback list by rating or source.
