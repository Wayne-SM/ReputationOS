import { Router } from 'express';
import { eq, desc, count, sql } from 'drizzle-orm';
import { ZodError } from 'zod';
import { db } from '../db/index.js';
import {
  businesses,
  businessMembers,
  users,
  googleReviewSettings,
  businessSettings,
  feedback,
  analyticsEvents,
  businessPayments,
} from '../db/schema.js';
import { requireAuth, requirePlatformAdmin, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  updateBusinessStatusSchema,
  updateBusinessSettingsSchema,
  recordPaymentSchema,
} from '../lib/validation.js';
import { buildSourceUrl } from '../services/qr.service.js';
import { env } from '../lib/env.js';
import type {
  AdminOverviewStats,
  AdminBusinessSummary,
  AdminBusinessDetail,
  BusinessStatus,
  Rating,
} from '../../../shared/types/index.js';

const router = Router();

// Guard all admin routes with authentication + platform admin check
router.use(requireAuth, requirePlatformAdmin);

// Helper to determine base URL
function getBaseUrl(req: any): string {
  if (env.CORS_ORIGIN && !env.CORS_ORIGIN.includes('*')) {
    return env.CORS_ORIGIN.replace(/\/+$/, '');
  }
  const protocol = req.protocol || 'http';
  const host = req.get('host') || `localhost:${env.PORT}`;
  return `${protocol}://${host}`;
}

// ── GET /api/v1/admin/overview ──────────────────────────────
router.get('/overview', async (_req, res) => {
  try {
    const statsResult = await db
      .select({
        status: businesses.status,
        count: count(),
      })
      .from(businesses)
      .groupBy(businesses.status);

    let totalBusinesses = 0;
    let pendingBusinesses = 0;
    let activeBusinesses = 0;
    let suspendedBusinesses = 0;
    let rejectedBusinesses = 0;

    for (const row of statsResult) {
      const c = Number(row.count);
      totalBusinesses += c;
      if (row.status === 'PENDING') pendingBusinesses += c;
      else if (row.status === 'ACTIVE') activeBusinesses += c;
      else if (row.status === 'SUSPENDED') suspendedBusinesses += c;
      else if (row.status === 'REJECTED') rejectedBusinesses += c;
    }

    const overview: AdminOverviewStats = {
      totalBusinesses,
      pendingBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      rejectedBusinesses,
    };

    res.status(200).json(overview);
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/v1/admin/businesses ────────────────────────────
router.get('/businesses', async (req, res) => {
  try {
    const statusFilter = req.query['status'] as string | undefined;

    // Fetch businesses with their primary owner
    const allBusinesses = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        status: businesses.status,
        createdAt: businesses.createdAt,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(businesses)
      .leftJoin(businessMembers, eq(businessMembers.businessId, businesses.id))
      .leftJoin(users, eq(businessMembers.userId, users.id))
      .orderBy(desc(businesses.createdAt));

    // Filter by status if provided and not 'all'
    const filtered = statusFilter && statusFilter !== 'all'
      ? allBusinesses.filter((b) => b.status === statusFilter)
      : allBusinesses;

    // For each business, query feedback count & latest payment
    const summaries: AdminBusinessSummary[] = await Promise.all(
      filtered.map(async (b) => {
        const [fbResult, ratingResult, paymentResult] = await Promise.all([
          db.select({ count: count() }).from(feedback).where(eq(feedback.businessId, b.id)),
          db.select({ avg: sql<number>`AVG(rating)` }).from(feedback).where(eq(feedback.businessId, b.id)),
          db
            .select({
              status: businessPayments.paymentStatus,
              amount: businessPayments.amount,
            })
            .from(businessPayments)
            .where(eq(businessPayments.businessId, b.id))
            .orderBy(desc(businessPayments.paymentDate))
            .limit(1),
        ]);

        const totalFeedback = fbResult[0]?.count ?? 0;
        const avg = ratingResult[0]?.avg;
        const averageRating = avg ? Number(Number(avg).toFixed(1)) : null;

        const latestPaymentStatus = (paymentResult[0]?.status as any) || 'UNPAID';
        const totalPaidAmount = paymentResult[0]?.amount ? Number(paymentResult[0].amount) : 0;

        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          status: b.status as BusinessStatus,
          createdAt: b.createdAt.toISOString(),
          ownerName: b.ownerName || 'Unknown Owner',
          ownerEmail: b.ownerEmail || 'No Email',
          latestPaymentStatus,
          totalPaidAmount,
          totalFeedback,
          averageRating,
        };
      }),
    );

    res.status(200).json(summaries);
  } catch (error) {
    console.error('Admin list businesses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/v1/admin/businesses/:id ────────────────────────
router.get('/businesses/:id', async (req, res) => {
  try {
    const businessId = String(req.params['id']);

    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // Owner info
    const [membership] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(businessMembers)
      .innerJoin(users, eq(businessMembers.userId, users.id))
      .where(eq(businessMembers.businessId, businessId))
      .limit(1);

    // Google review settings
    const [googleConfig] = await db
      .select()
      .from(googleReviewSettings)
      .where(eq(googleReviewSettings.businessId, businessId))
      .limit(1);

    // Business settings
    const [settings] = await db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.businessId, businessId))
      .limit(1);

    // Aggregated Metrics
    const [
      receptionScansRes,
      instagramVisitsRes,
      feedbackCountRes,
      googleClicksRes,
      ratingAvgRes,
      recentFb,
      paymentsList,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(sql`${analyticsEvents.businessId} = ${businessId} AND ${analyticsEvents.eventType} = 'feedback_page_view' AND ${analyticsEvents.sourceType} = 'reception'`),
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(sql`${analyticsEvents.businessId} = ${businessId} AND ${analyticsEvents.eventType} = 'feedback_page_view' AND ${analyticsEvents.sourceType} = 'instagram'`),
      db.select({ count: count() }).from(feedback).where(eq(feedback.businessId, businessId)),
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(sql`${analyticsEvents.businessId} = ${businessId} AND ${analyticsEvents.eventType} = 'google_review_clicked'`),
      db.select({ avg: sql<number>`AVG(rating)` }).from(feedback).where(eq(feedback.businessId, businessId)),
      db
        .select()
        .from(feedback)
        .where(eq(feedback.businessId, businessId))
        .orderBy(desc(feedback.createdAt))
        .limit(20),
      db
        .select()
        .from(businessPayments)
        .where(eq(businessPayments.businessId, businessId))
        .orderBy(desc(businessPayments.paymentDate)),
    ]);

    const totalFeedback = feedbackCountRes[0]?.count ?? 0;
    const avg = ratingAvgRes[0]?.avg;

    const baseUrl = getBaseUrl(req);
    const receptionUrl = buildSourceUrl(baseUrl, biz.slug, 'reception');
    const instagramUrl = buildSourceUrl(baseUrl, biz.slug, 'instagram');

    const detail: AdminBusinessDetail = {
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        status: biz.status as BusinessStatus,
        description: biz.description,
        logoUrl: biz.logoUrl,
        accentColor: biz.accentColor,
        phone: biz.phone,
        email: biz.email,
        website: biz.website,
        createdAt: biz.createdAt.toISOString(),
      },
      owner: {
        id: membership?.id || '',
        name: membership?.name || 'Unknown',
        email: membership?.email || 'Unknown',
      },
      googleReview: {
        googlePlaceId: googleConfig?.googlePlaceId ?? null,
        googleReviewUrl: googleConfig?.googleReviewUrl ?? null,
        googleRating: googleConfig?.googleRating ? Number(googleConfig.googleRating) : null,
        googleReviewCount: googleConfig?.googleReviewCount ?? 0,
      },
      settings: {
        feedbackWelcomeText: settings?.feedbackWelcomeText || 'How was your experience?',
        feedbackThankYouText: settings?.feedbackThankYouText || 'Thank you for your feedback!',
        googleReviewCtaText: settings?.googleReviewCtaText || 'Share your experience on Google',
        collectContactInfo: settings?.collectContactInfo ?? false,
      },
      metrics: {
        googleRating: googleConfig?.googleRating ? Number(googleConfig.googleRating) : null,
        googleReviewCount: googleConfig?.googleReviewCount ?? 0,
        totalFeedback,
        receptionScans: receptionScansRes[0]?.count ?? 0,
        instagramVisits: instagramVisitsRes[0]?.count ?? 0,
        googleReviewClicks: googleClicksRes[0]?.count ?? 0,
        feedbackSubmissions: totalFeedback,
        averageRating: avg ? Number(Number(avg).toFixed(1)) : null,
      },
      sources: {
        receptionUrl,
        instagramUrl,
      },
      recentFeedback: recentFb.map((f) => ({
        id: f.id,
        rating: f.rating as Rating,
        text: f.text,
        sourceType: f.sourceType as any,
        isRead: f.isRead,
        googleReviewClicked: f.googleReviewClicked,
        customerName: f.customerName,
        customerEmail: f.customerEmail,
        createdAt: f.createdAt.toISOString(),
      })),
      payments: paymentsList.map((p) => ({
        id: p.id,
        businessId: p.businessId,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod as any,
        paymentStatus: p.paymentStatus as any,
        paymentDate: p.paymentDate.toISOString(),
        reference: p.reference,
        notes: p.notes,
        recordedBy: p.recordedBy,
        createdAt: p.createdAt.toISOString(),
      })),
    };

    res.status(200).json(detail);
  } catch (error) {
    console.error('Admin get business detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/v1/admin/businesses/:id/status ───────────────
// Approve, Reject, Suspend, or Reactivate business
router.patch('/businesses/:id/status', async (req, res) => {
  try {
    const businessId = String(req.params['id']);
    const { status } = updateBusinessStatusSchema.parse(req.body);

    const [biz] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const isActive = status === 'ACTIVE';

    await db
      .update(businesses)
      .set({
        status,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    res.status(200).json({
      success: true,
      message: `Business status updated to ${status}`,
      status,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.flatten().fieldErrors });
      return;
    }
    console.error('Admin update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/v1/admin/businesses/:id/settings ─────────────
// Admin configuration of Google Review URL or branding
router.patch('/businesses/:id/settings', async (req, res) => {
  try {
    const businessId = String(req.params['id']);
    const input = updateBusinessSettingsSchema.parse(req.body);

    const [biz] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // 1. Update business table
    const bizUpdates: Partial<typeof businesses.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) bizUpdates.name = input.name;
    if (input.accentColor !== undefined) bizUpdates.accentColor = input.accentColor;
    if (input.description !== undefined) bizUpdates.description = input.description;
    if (input.phone !== undefined) bizUpdates.phone = input.phone;
    if (input.website !== undefined) bizUpdates.website = input.website;

    if (Object.keys(bizUpdates).length > 1) {
      await db.update(businesses).set(bizUpdates).where(eq(businesses.id, businessId));
    }

    // 2. Update Google Review Settings
    const googleUpdates: Partial<typeof googleReviewSettings.$inferInsert> = { updatedAt: new Date() };
    if (input.googleReviewUrl !== undefined) googleUpdates.googleReviewUrl = input.googleReviewUrl;
    if (input.googlePlaceId !== undefined) googleUpdates.googlePlaceId = input.googlePlaceId;

    if (Object.keys(googleUpdates).length > 1) {
      await db
        .update(googleReviewSettings)
        .set(googleUpdates)
        .where(eq(googleReviewSettings.businessId, businessId));
    }

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.flatten().fieldErrors });
      return;
    }
    console.error('Admin update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/v1/admin/businesses/:id/payments ───────────────
router.get('/businesses/:id/payments', async (req, res) => {
  try {
    const businessId = String(req.params['id']);

    const paymentsList = await db
      .select()
      .from(businessPayments)
      .where(eq(businessPayments.businessId, businessId))
      .orderBy(desc(businessPayments.paymentDate));

    res.status(200).json(
      paymentsList.map((p) => ({
        id: p.id,
        businessId: p.businessId,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        paymentDate: p.paymentDate.toISOString(),
        reference: p.reference,
        notes: p.notes,
        recordedBy: p.recordedBy,
        createdAt: p.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error('Admin get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/v1/admin/businesses/:id/payments ──────────────
// Record manual UPI, bank transfer, or cash payment
router.post('/businesses/:id/payments', async (req, res) => {
  try {
    const businessId = String(req.params['id']);
    const authReq = req as unknown as AuthenticatedRequest;
    const input = recordPaymentSchema.parse(req.body);

    const [biz] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const [payment] = await db
      .insert(businessPayments)
      .values({
        businessId,
        amount: input.amount.toString(),
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus || 'COMPLETED',
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        reference: input.reference || null,
        notes: input.notes || null,
        recordedBy: authReq.user.id,
      })
      .returning();

    res.status(201).json({
      success: true,
      payment: {
        id: payment!.id,
        businessId: payment!.businessId,
        amount: Number(payment!.amount),
        paymentMethod: payment!.paymentMethod,
        paymentStatus: payment!.paymentStatus,
        paymentDate: payment!.paymentDate.toISOString(),
        reference: payment!.reference,
        notes: payment!.notes,
        createdAt: payment!.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.flatten().fieldErrors });
      return;
    }
    console.error('Admin record payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
