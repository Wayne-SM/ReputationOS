import { describe, it, expect } from 'vitest';
import { updateBusinessSettingsSchema } from '../../lib/validation.js';
import type { Rating, RatingDistribution, DashboardMetrics } from '../../../../shared/types/index.js';

describe('Phase 5: Lean Business Dashboard & Settings', () => {
  describe('Business Settings Validation', () => {
    it('should validate valid business settings update payload', () => {
      const validPayload = {
        name: 'Grand Horizon Cafe',
        accentColor: '#10b981',
        description: 'Artisanal coffee and pastries',
        googleReviewUrl: 'https://g.page/r/grandhorizon/review',
        feedbackWelcomeText: 'How was your dining experience?',
        feedbackThankYouText: 'We appreciate your review!',
        googleReviewCtaText: 'Rate us on Google',
      };

      const result = updateBusinessSettingsSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid hex accent colors', () => {
      const invalidColors = ['#fff', 'blue', '123456', '#1234567', '#zzz123'];

      for (const accentColor of invalidColors) {
        const result = updateBusinessSettingsSchema.safeParse({ accentColor });
        expect(result.success).toBe(false);
      }
    });

    it('should accept valid 6-char hex accent colors', () => {
      const validColors = ['#2563eb', '#10b981', '#f59e0b', '#000000', '#ffffff'];

      for (const accentColor of validColors) {
        const result = updateBusinessSettingsSchema.safeParse({ accentColor });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid google review URLs', () => {
      const result = updateBusinessSettingsSchema.safeParse({
        googleReviewUrl: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
    });

    it('should allow clearing googleReviewUrl with empty string or null', () => {
      expect(updateBusinessSettingsSchema.safeParse({ googleReviewUrl: '' }).success).toBe(true);
      expect(updateBusinessSettingsSchema.safeParse({ googleReviewUrl: null }).success).toBe(true);
    });

    it('should reject empty business names', () => {
      const result = updateBusinessSettingsSchema.safeParse({
        name: '   ',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('MVP Metric Aggregation & Rating Distribution Logic', () => {
    // Helper function that mirrors the server calculation logic
    function computeMetricsAndDistribution(
      countsByRating: Record<number, number>,
      telemetry: {
        receptionScans: number;
        instagramVisits: number;
        googleClicks: number;
      },
    ): { metrics: DashboardMetrics; ratingDistribution: RatingDistribution[] } {
      const ratings: Rating[] = [5, 4, 3, 2, 1];
      let totalFeedback = 0;
      let ratingSum = 0;

      for (const r of ratings) {
        const count = countsByRating[r] || 0;
        totalFeedback += count;
        ratingSum += r * count;
      }

      const averageRating =
        totalFeedback > 0 ? Number((ratingSum / totalFeedback).toFixed(1)) : null;

      const ratingDistribution: RatingDistribution[] = ratings.map((rating) => {
        const count = countsByRating[rating] || 0;
        const percentage =
          totalFeedback > 0 ? Number(((count / totalFeedback) * 100).toFixed(1)) : 0;
        return {
          rating,
          count,
          percentage,
        };
      });

      const metrics: DashboardMetrics = {
        receptionScans: telemetry.receptionScans,
        instagramVisits: telemetry.instagramVisits,
        feedbackSubmissions: totalFeedback,
        googleReviewClicks: telemetry.googleClicks,
        totalFeedback,
        averageRating,
      };

      return { metrics, ratingDistribution };
    }

    it('should compute the 7 essential metrics correctly when empty', () => {
      const { metrics, ratingDistribution } = computeMetricsAndDistribution(
        {},
        { receptionScans: 0, instagramVisits: 0, googleClicks: 0 },
      );

      // Verify the 7 essential MVP metrics
      expect(metrics.receptionScans).toBe(0);
      expect(metrics.instagramVisits).toBe(0);
      expect(metrics.feedbackSubmissions).toBe(0);
      expect(metrics.googleReviewClicks).toBe(0);
      expect(metrics.totalFeedback).toBe(0);
      expect(metrics.averageRating).toBeNull();
      expect(ratingDistribution).toHaveLength(5);

      for (const item of ratingDistribution) {
        expect(item.count).toBe(0);
        expect(item.percentage).toBe(0);
      }
    });

    it('should compute exact counts, percentages, and average rating', () => {
      const counts = {
        5: 12, // 60%
        4: 4,  // 20%
        3: 2,  // 10%
        2: 1,  // 5%
        1: 1,  // 5%
      };
      // Total = 20
      // Sum = 12*5 + 4*4 + 2*3 + 1*2 + 1*1 = 60 + 16 + 6 + 2 + 1 = 85
      // Avg = 85 / 20 = 4.25 -> 4.3 or 4.25

      const { metrics, ratingDistribution } = computeMetricsAndDistribution(counts, {
        receptionScans: 54,
        instagramVisits: 28,
        googleClicks: 16,
      });

      expect(metrics.receptionScans).toBe(54);
      expect(metrics.instagramVisits).toBe(28);
      expect(metrics.feedbackSubmissions).toBe(20);
      expect(metrics.googleReviewClicks).toBe(16);
      expect(metrics.totalFeedback).toBe(20);
      expect(metrics.averageRating).toBe(4.3);

      expect(ratingDistribution[0]).toEqual({ rating: 5, count: 12, percentage: 60 });
      expect(ratingDistribution[1]).toEqual({ rating: 4, count: 4, percentage: 20 });
      expect(ratingDistribution[2]).toEqual({ rating: 3, count: 2, percentage: 10 });
      expect(ratingDistribution[3]).toEqual({ rating: 2, count: 1, percentage: 5 });
      expect(ratingDistribution[4]).toEqual({ rating: 1, count: 1, percentage: 5 });
    });

    it('should enforce descending 5 to 1 order for rating distribution', () => {
      const { ratingDistribution } = computeMetricsAndDistribution(
        { 1: 5, 5: 10 },
        { receptionScans: 0, instagramVisits: 0, googleClicks: 0 },
      );

      const ratingsOrder = ratingDistribution.map((d) => d.rating);
      expect(ratingsOrder).toEqual([5, 4, 3, 2, 1]);
    });
  });
});
