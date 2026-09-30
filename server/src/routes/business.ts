import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { ZodError } from 'zod';
import { db } from '../db/index.js';
import { businesses, businessSettings, googleReviewSettings } from '../db/schema.js';
import { requireAuth, requireBusiness, requireRole, type BusinessRequest } from '../middleware/auth.js';
import { updateBusinessSettingsSchema } from '../lib/validation.js';
import type { BusinessSettingsData } from '../../../shared/types/index.js';

const router = Router();

// ── GET /api/v1/business/settings ───────────────────────────
// Returns business profile, google review settings, and feedback config
router.get('/settings', requireAuth, requireBusiness, async (req, res) => {
  try {
    const bizReq = req as BusinessRequest;
    const businessId = bizReq.business.id;

    const [biz] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        description: businesses.description,
        logoUrl: businesses.logoUrl,
        accentColor: businesses.accentColor,
        phone: businesses.phone,
        website: businesses.website,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const [googleConfig] = await db
      .select({
        googlePlaceId: googleReviewSettings.googlePlaceId,
        googleReviewUrl: googleReviewSettings.googleReviewUrl,
        googleRating: googleReviewSettings.googleRating,
        googleReviewCount: googleReviewSettings.googleReviewCount,
      })
      .from(googleReviewSettings)
      .where(eq(googleReviewSettings.businessId, businessId))
      .limit(1);

    const [settings] = await db
      .select({
        feedbackWelcomeText: businessSettings.feedbackWelcomeText,
        feedbackThankYouText: businessSettings.feedbackThankYouText,
        googleReviewCtaText: businessSettings.googleReviewCtaText,
        collectContactInfo: businessSettings.collectContactInfo,
        contactInfoRequired: businessSettings.contactInfoRequired,
      })
      .from(businessSettings)
      .where(eq(businessSettings.businessId, businessId))
      .limit(1);

    const responseData: BusinessSettingsData = {
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        description: biz.description,
        logoUrl: biz.logoUrl,
        accentColor: biz.accentColor || '#2563eb',
        phone: biz.phone,
        website: biz.website,
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
        contactInfoRequired: settings?.contactInfoRequired ?? false,
      },
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching business settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/v1/business/settings ──────────────────────────
// Updates business profile, branding, or Google Review URL (Admin or Owner only)
router.patch('/settings', requireAuth, requireBusiness, requireRole('admin'), async (req, res) => {
  try {
    const bizReq = req as BusinessRequest;
    const businessId = bizReq.business.id;

    const input = updateBusinessSettingsSchema.parse(req.body);

    // 1. Update business table if name, accentColor, description, phone, or website are provided
    const bizUpdates: Partial<typeof businesses.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.name !== undefined) bizUpdates.name = input.name;
    if (input.accentColor !== undefined) bizUpdates.accentColor = input.accentColor;
    if (input.description !== undefined) bizUpdates.description = input.description;
    if (input.phone !== undefined) bizUpdates.phone = input.phone;
    if (input.website !== undefined) bizUpdates.website = input.website;

    if (Object.keys(bizUpdates).length > 1) {
      await db.update(businesses).set(bizUpdates).where(eq(businesses.id, businessId));
    }

    // 2. Update Google Review Settings if review URL or Place ID are provided
    const googleUpdates: Partial<typeof googleReviewSettings.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.googleReviewUrl !== undefined) googleUpdates.googleReviewUrl = input.googleReviewUrl;
    if (input.googlePlaceId !== undefined) googleUpdates.googlePlaceId = input.googlePlaceId;

    if (Object.keys(googleUpdates).length > 1) {
      await db
        .update(googleReviewSettings)
        .set(googleUpdates)
        .where(eq(googleReviewSettings.businessId, businessId));
    }

    // 3. Update Business Settings if prompt/welcome text fields are provided
    const configUpdates: Partial<typeof businessSettings.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.feedbackWelcomeText !== undefined) {
      configUpdates.feedbackWelcomeText = input.feedbackWelcomeText;
    }
    if (input.feedbackThankYouText !== undefined) {
      configUpdates.feedbackThankYouText = input.feedbackThankYouText;
    }
    if (input.googleReviewCtaText !== undefined) {
      configUpdates.googleReviewCtaText = input.googleReviewCtaText;
    }

    if (Object.keys(configUpdates).length > 1) {
      await db
        .update(businessSettings)
        .set(configUpdates)
        .where(eq(businessSettings.businessId, businessId));
    }

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.flatten().fieldErrors,
      });
      return;
    }
    console.error('Error updating business settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
