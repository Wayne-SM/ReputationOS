import { Router } from 'express';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { db } from '../db/index.js';
import {
  businesses,
  businessSettings,
  googleReviewSettings,
  feedback,
  analyticsEvents,
} from '../db/schema.js';
import { feedbackSubmissionSchema, clickGoogleSchema } from '../lib/validation.js';
import { env } from '../lib/env.js';

const router = Router();

// ── Rate Limiters ───────────────────────────────────────────

const feedbackLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.FEEDBACK_RATE_LIMIT_MAX, // 10 submissions per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this connection, please try again later.' },
});

// ── GET /r/:businessSlug ────────────────────────────────────
// Resolves public business branding without exposing private data
router.get('/r/:businessSlug', async (req, res) => {
  try {
    const businessSlug = String(req.params['businessSlug']);

    const [biz] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        description: businesses.description,
        logoUrl: businesses.logoUrl,
        accentColor: businesses.accentColor,
        status: businesses.status,
        isActive: businesses.isActive,
      })
      .from(businesses)
      .where(eq(businesses.slug, businessSlug))
      .limit(1);

    if (!biz || (biz.status !== 'ACTIVE' && !biz.isActive)) {
      res.status(404).json({ error: 'Business not found or inactive' });
      return;
    }

    const [settings] = await db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.businessId, biz.id))
      .limit(1);

    // Track page view event (strictly reception vs instagram)
    const rawSource = req.query['source'] as string;
    const validSource = rawSource === 'instagram' ? 'instagram' : 'reception';

    await db.insert(analyticsEvents).values({
      businessId: biz.id,
      eventType: 'feedback_page_view',
      sourceType: validSource,
      metadata: { userAgent: req.headers['user-agent']?.slice(0, 100) },
    }).catch(() => {
      // Non-blocking telemetry
    });

    res.status(200).json({
      name: biz.name,
      slug: biz.slug,
      description: biz.description,
      logoUrl: biz.logoUrl,
      accentColor: biz.accentColor || '#2563eb',
      feedbackWelcomeText: settings?.feedbackWelcomeText || 'How was your experience?',
      feedbackThankYouText: settings?.feedbackThankYouText || 'Thank you for your feedback!',
      googleReviewCtaText: settings?.googleReviewCtaText || 'Share your experience on Google',
      collectContactInfo: settings?.collectContactInfo ?? false,
      contactInfoRequired: settings?.contactInfoRequired ?? false,
    });
  } catch (error) {
    console.error('Error fetching public business profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /r/:businessSlug/feedback ──────────────────────────
// Customer feedback submission. STRICT POLICY: NO REVIEW GATING.
// Google review CTA is returned to ALL customers regardless of rating (1 to 5).
router.post('/r/:businessSlug/feedback', feedbackLimiter, async (req, res) => {
  try {
    const businessSlug = String(req.params['businessSlug']);
    const input = feedbackSubmissionSchema.parse(req.body);

    if (input.honeypot && input.honeypot.length > 0) {
      // Silently discard bot spam
      res.status(200).json({ success: true, googleReviewUrl: null });
      return;
    }

    const [biz] = await db
      .select({ id: businesses.id, status: businesses.status, isActive: businesses.isActive })
      .from(businesses)
      .where(eq(businesses.slug, businessSlug))
      .limit(1);

    if (!biz || (biz.status !== 'ACTIVE' && !biz.isActive)) {
      res.status(404).json({ error: 'Business not found or inactive' });
      return;
    }

    // IP hash for anti-abuse (not stored as raw PII)
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');

    // 1. Store feedback submission
    await db.insert(feedback).values({
      businessId: biz.id,
      sourceType: input.source,
      sessionId: input.sessionId,
      rating: input.rating,
      text: input.text || null,
      customerName: input.customerName || null,
      customerEmail: input.customerEmail || null,
      customerPhone: input.customerPhone || null,
      ipHash,
      userAgent: req.headers['user-agent']?.slice(0, 500) || null,
      isRead: false,
      googleReviewClicked: false,
    });

    // 2. Log feedback_submitted analytics event
    await db.insert(analyticsEvents).values({
      businessId: biz.id,
      eventType: 'feedback_submitted',
      sourceType: input.source,
      sessionId: input.sessionId,
      metadata: { rating: input.rating },
    }).catch(() => {
      // Non-blocking telemetry
    });

    // 3. Fetch Google review URL
    const [googleConfig] = await db
      .select({ googleReviewUrl: googleReviewSettings.googleReviewUrl })
      .from(googleReviewSettings)
      .where(eq(googleReviewSettings.businessId, biz.id))
      .limit(1);

    const googleReviewUrl = googleConfig?.googleReviewUrl || null;

    // 4. Return response: Google Review URL is provided for ALL ratings (1-5)
    // NEVER apply rating-based condition (no review gating)
    res.status(201).json({
      success: true,
      googleReviewUrl,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.flatten().fieldErrors,
      });
      return;
    }
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /r/:businessSlug/click-google ──────────────────────
// Track when customer clicks the Google review CTA
router.post('/r/:businessSlug/click-google', async (req, res) => {
  try {
    const businessSlug = String(req.params['businessSlug']);
    const input = clickGoogleSchema.parse(req.body);

    const [biz] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, businessSlug))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // Mark feedback record if matching session exists
    await db
      .update(feedback)
      .set({ googleReviewClicked: true })
      .where(and(eq(feedback.businessId, biz.id), eq(feedback.sessionId, input.sessionId)))
      .catch(() => {
        // Non-blocking update
      });

    // Log google_review_clicked event
    await db.insert(analyticsEvents).values({
      businessId: biz.id,
      eventType: 'google_review_clicked',
      sourceType: input.source,
      sessionId: input.sessionId,
    }).catch(() => {
      // Non-blocking telemetry
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }
    console.error('Error tracking Google click:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
