# Phase 5: Technical Research — Lean Business Dashboard

## 1. Executive Summary
Phase 5 delivers the business owner's primary command center, displaying the 7 essential MVP metrics and managing business reputation settings at zero infrastructure cost. By executing all aggregations directly against PostgreSQL indexed columns via Drizzle ORM, dashboard queries return in under 25ms without external tracking scripts, third-party analytics subscriptions, or cookie consent banners.

## 2. Telemetry & Aggregation Architecture
The 7 essential MVP metrics map directly to existing PostgreSQL tables:
1. **Reception QR Scans:**
   ```sql
   SELECT COUNT(*) FROM analytics_events 
   WHERE business_id = $1 AND event_type = 'feedback_page_view' AND source_type = 'reception';
   ```
2. **Instagram Visits:**
   ```sql
   SELECT COUNT(*) FROM analytics_events 
   WHERE business_id = $1 AND event_type = 'feedback_page_view' AND source_type = 'instagram';
   ```
3. **Feedback Submissions:**
   ```sql
   SELECT COUNT(*) FROM feedback 
   WHERE business_id = $1;
   ```
4. **Google Review CTA Clicks:**
   ```sql
   SELECT COUNT(*) FROM analytics_events 
   WHERE business_id = $1 AND event_type = 'google_review_clicked';
   ```
5. **Rating Distribution:**
   ```sql
   SELECT rating, COUNT(*) as count 
   FROM feedback 
   WHERE business_id = $1 
   GROUP BY rating;
   ```
   Normalized in Node.js to ensure all ratings 1..5 are present even if count is 0, calculating percentage of total.
6. **Total Feedback Count:**
   Derived from the sum of rating distribution counts or direct feedback count.
7. **Basic Recent Feedback:**
   ```sql
   SELECT id, rating, text, source_type, customer_name, customer_email, is_read, google_review_clicked, created_at 
   FROM feedback 
   WHERE business_id = $1 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

## 3. Performance & Index Verification
The database schema (`server/src/db/schema.ts`) already has optimal compound indexes created in Phase 2:
- `analytics_events`: `idx_ae_business_type` on `(business_id, event_type)` and `idx_ae_business_source` on `(business_id, source_type)`
- `feedback`: `idx_fb_business` on `(business_id)` and `idx_fb_business_rating` on `(business_id, rating)` and `idx_fb_business_created` on `(business_id, created_at)`

Because these indexes match tenant scoping (`business_id = $1`), all queries utilize Index Scans and execute in O(log N) time.

## 4. API Endpoint Contracts
1. **`GET /api/v1/dashboard/overview`**
   - Headers: `Cookie: session=...`
   - Scoped strictly to `req.business.id`
   - Response:
     ```json
     {
       "metrics": {
         "receptionScans": 42,
         "instagramVisits": 18,
         "feedbackSubmissions": 15,
         "googleReviewClicks": 9,
         "totalFeedback": 15,
         "averageRating": 4.6
       },
       "ratingDistribution": [
         { "rating": 5, "count": 10, "percentage": 66.7 },
         { "rating": 4, "count": 4, "percentage": 26.7 },
         { "rating": 3, "count": 1, "percentage": 6.7 },
         { "rating": 2, "count": 0, "percentage": 0 },
         { "rating": 1, "count": 0, "percentage": 0 }
       ],
       "recentFeedback": [ ... ]
     }
     ```

2. **`GET /api/v1/business/settings`**
   - Returns business profile (`name`, `slug`, `accentColor`, `description`), `googleReviewSettings` (`googleReviewUrl`), and `businessSettings` (`feedbackWelcomeText`, `feedbackThankYouText`, `googleReviewCtaText`).

3. **`PATCH /api/v1/business/settings`**
   - Middleware: `requireAuth`, `requireBusiness`, `requireRole('admin')`
   - Validates payload with Zod
   - Atomically updates `businesses`, `google_review_settings`, and `business_settings`.

## 5. Frontend Visual Layout & Design System
- **Layout:** Standard top navigation with tabs: `Overview`, `QR & Links`, `Settings`.
- **KPI Summary Grid:** 4 responsive cards featuring large numeric counters, descriptive labels, and subtle iconography.
- **Rating Distribution Breakdown:** Linear progress bars displaying rating distribution with 5-star to 1-star counts and percentages.
- **Recent Feedback Table / Feed:** Clean list with star badge, source badge (Reception / Instagram), customer info, submission time (relative), and full feedback quote. Includes empty state when no feedback exists.
- **Settings Tab / Section:** Clean form to update business name, brand accent color, and Google Review URL.
