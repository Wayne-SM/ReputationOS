import { Router } from 'express';
import { and, eq, desc, count } from 'drizzle-orm';
import { db } from '../db/index.js';
import { feedback, analyticsEvents } from '../db/schema.js';
import { requireAuth, requireBusiness, type BusinessRequest } from '../middleware/auth.js';
import type { DashboardOverview, Rating, RatingDistribution, FeedbackItem } from '../../../shared/types/index.js';

const router = Router();

// ── GET /api/v1/dashboard/overview ───────────────────────────
// Returns the 7 essential MVP metrics, rating distribution, and recent feedback
router.get('/overview', requireAuth, requireBusiness, async (req, res) => {
  try {
    const bizReq = req as BusinessRequest;
    const businessId = bizReq.business.id;

    // Parallel execution of all 6 database aggregation queries
    const [
      receptionScansResult,
      instagramVisitsResult,
      feedbackCountResult,
      googleClicksResult,
      ratingDistResult,
      recentFeedbackList,
    ] = await Promise.all([
      // 1. Reception QR Scans
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.businessId, businessId),
            eq(analyticsEvents.eventType, 'feedback_page_view'),
            eq(analyticsEvents.sourceType, 'reception'),
          ),
        ),

      // 2. Instagram Bio Link Visits
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.businessId, businessId),
            eq(analyticsEvents.eventType, 'feedback_page_view'),
            eq(analyticsEvents.sourceType, 'instagram'),
          ),
        ),

      // 3. Feedback Submissions Count
      db
        .select({ count: count() })
        .from(feedback)
        .where(eq(feedback.businessId, businessId)),

      // 4. Google Review CTA Clicks
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.businessId, businessId),
            eq(analyticsEvents.eventType, 'google_review_clicked'),
          ),
        ),

      // 5. Rating Distribution
      db
        .select({
          rating: feedback.rating,
          count: count(),
        })
        .from(feedback)
        .where(eq(feedback.businessId, businessId))
        .groupBy(feedback.rating),

      // 6. Recent Feedback Submissions (latest 20)
      db
        .select({
          id: feedback.id,
          rating: feedback.rating,
          text: feedback.text,
          sourceType: feedback.sourceType,
          isRead: feedback.isRead,
          googleReviewClicked: feedback.googleReviewClicked,
          customerName: feedback.customerName,
          customerEmail: feedback.customerEmail,
          createdAt: feedback.createdAt,
        })
        .from(feedback)
        .where(eq(feedback.businessId, businessId))
        .orderBy(desc(feedback.createdAt))
        .limit(20),
    ]);

    const receptionScans = receptionScansResult[0]?.count ?? 0;
    const instagramVisits = instagramVisitsResult[0]?.count ?? 0;
    const totalFeedback = feedbackCountResult[0]?.count ?? 0;
    const googleReviewClicks = googleClicksResult[0]?.count ?? 0;

    // Build complete 1-5 rating map
    const countsByRating: Record<Rating, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let ratingSum = 0;
    for (const row of ratingDistResult) {
      const r = row.rating as Rating;
      if (r >= 1 && r <= 5) {
        countsByRating[r] = row.count;
        ratingSum += r * row.count;
      }
    }

    const averageRating =
      totalFeedback > 0 ? Number((ratingSum / totalFeedback).toFixed(1)) : null;

    // Descending order 5 down to 1 for standard reputation distribution display
    const ratingDistribution: RatingDistribution[] = ([5, 4, 3, 2, 1] as Rating[]).map(
      (rating) => {
        const countForRating = countsByRating[rating];
        const percentage =
          totalFeedback > 0
            ? Number(((countForRating / totalFeedback) * 100).toFixed(1))
            : 0;
        return {
          rating,
          count: countForRating,
          percentage,
        };
      },
    );

    const formattedRecentFeedback: FeedbackItem[] = recentFeedbackList.map((item) => ({
      id: item.id,
      rating: item.rating as Rating,
      text: item.text,
      sourceType: item.sourceType as any,
      isRead: item.isRead,
      googleReviewClicked: item.googleReviewClicked,
      customerName: item.customerName,
      customerEmail: item.customerEmail,
      createdAt: item.createdAt.toISOString(),
    }));

    const responseData: DashboardOverview = {
      metrics: {
        receptionScans,
        instagramVisits,
        feedbackSubmissions: totalFeedback,
        googleReviewClicks,
        totalFeedback,
        averageRating,
      },
      ratingDistribution,
      recentFeedback: formattedRecentFeedback,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
