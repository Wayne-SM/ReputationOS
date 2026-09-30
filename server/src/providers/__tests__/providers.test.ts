import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProviders,
  setProvider,
  resetProviders,
  NoOpAiProvider,
  ConsoleMessagingProvider,
  FreeTierBillingProvider,
  ConsoleEmailProvider,
  type IAiProvider,
} from '../index.js';

describe('Phase 6: Provider Abstractions & Extensibility', () => {
  beforeEach(() => {
    resetProviders();
  });

  describe('Provider Factory & Registry', () => {
    it('should initialize all 4 providers with default zero-cost implementations', () => {
      const providers = getProviders();

      expect(providers.ai).toBeInstanceOf(NoOpAiProvider);
      expect(providers.messaging).toBeInstanceOf(ConsoleMessagingProvider);
      expect(providers.billing).toBeInstanceOf(FreeTierBillingProvider);
      expect(providers.email).toBeInstanceOf(ConsoleEmailProvider);

      expect(providers.ai.name).toBe('noop');
      expect(providers.messaging.name).toBe('console');
      expect(providers.billing.name).toBe('free_tier');
      expect(providers.email.name).toBe('console');
    });

    it('should allow runtime swapping of providers via setProvider', () => {
      const customAiProvider: IAiProvider = {
        name: 'mock_custom_ai',
        async analyzeSentiment() {
          return { sentiment: 'positive', score: 0.99, tags: ['custom'] };
        },
        async suggestResponse() {
          return { suggestedResponse: 'Custom AI response', tone: 'warm' };
        },
        async summarizeFeedback() {
          return 'Custom summary';
        },
      };

      setProvider('ai', customAiProvider);
      expect(getProviders().ai.name).toBe('mock_custom_ai');

      resetProviders();
      expect(getProviders().ai.name).toBe('noop');
    });
  });

  describe('NoOpAiProvider', () => {
    const ai = new NoOpAiProvider();

    it('should analyze positive sentiment based on positive keywords', async () => {
      const result = await ai.analyzeSentiment('Great service and delicious coffee!');
      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
      expect(result.tags).toContain('great');
      expect(result.tags).toContain('delicious');
    });

    it('should analyze negative sentiment based on negative keywords', async () => {
      const result = await ai.analyzeSentiment('Terrible and slow experience, food was cold');
      expect(result.sentiment).toBe('negative');
      expect(result.score).toBeLessThan(0);
      expect(result.tags).toContain('terrible');
      expect(result.tags).toContain('slow');
      expect(result.tags).toContain('cold');
    });

    it('should return neutral sentiment for empty or generic feedback', async () => {
      const result = await ai.analyzeSentiment('');
      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(0);
      expect(result.tags).toEqual([]);
    });

    it('should provide warm response suggestions for 4 and 5 star ratings', async () => {
      const response = await ai.suggestResponse('Loved it', 5, 'Grand Cafe');
      expect(response.tone).toBe('warm');
      expect(response.suggestedResponse).toContain('Grand Cafe');
      expect(response.suggestedResponse).toContain('thrilled');
    });

    it('should provide apologetic response suggestions for ratings <= 3', async () => {
      const response = await ai.suggestResponse('Wait time was long', 2, 'Grand Cafe');
      expect(response.tone).toBe('apologetic');
      expect(response.suggestedResponse).toContain('Grand Cafe');
      expect(response.suggestedResponse).toContain('apologize');
    });

    it('should compute average rating in feedback summary', async () => {
      const summary = await ai.summarizeFeedback([
        { text: 'Great', rating: 5 },
        { text: 'Good', rating: 4 },
        { text: 'Okay', rating: 3 },
      ]);
      expect(summary).toBe('Summary of 3 customer reviews (Average rating: 4.0/5.0).');
    });

    it('should handle empty feedback list gracefully in summary', async () => {
      const summary = await ai.summarizeFeedback([]);
      expect(summary).toBe('No feedback available to summarize.');
    });
  });

  describe('ConsoleMessagingProvider', () => {
    const messaging = new ConsoleMessagingProvider();

    it('should format and simulate review invite transmission', async () => {
      const result = await messaging.sendReviewInvite({
        to: '+919876543210',
        customerName: 'Rahul',
        businessName: 'Grand Horizon Cafe',
        reviewLink: 'https://reputationos.local/r/grand-horizon?source=whatsapp',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('simulated');
      expect(result.messageId).toMatch(/^msg_sim_/);
    });

    it('should reject requests with missing required fields', async () => {
      const result = await messaging.sendReviewInvite({
        to: '',
        businessName: '',
        reviewLink: '',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });

  describe('FreeTierBillingProvider', () => {
    const billing = new FreeTierBillingProvider();

    it('should report active free tier status with MVP capabilities', async () => {
      const status = await billing.getSubscriptionStatus('biz-123');

      expect(status.plan).toBe('free');
      expect(status.status).toBe('active');
      expect(status.canExportReports).toBe(true);
      expect(status.canAddLocations).toBe(false);
      expect(status.canUseAi).toBe(false);
    });

    it('should generate simulated checkout and portal sessions without Stripe', async () => {
      const checkout = await billing.createCheckoutSession('biz-123', 'pro', 'https://app.local/dashboard');
      expect(checkout.checkoutUrl).toContain('https://app.local/dashboard');

      const portal = await billing.createCustomerPortalSession('biz-123', 'https://app.local/settings');
      expect(portal.portalUrl).toBe('https://app.local/settings');
    });
  });

  describe('ConsoleEmailProvider', () => {
    const email = new ConsoleEmailProvider();

    it('should format and simulate email transmission', async () => {
      const result = await email.sendEmail({
        to: 'owner@example.com',
        subject: 'Weekly Reputation Digest',
        text: 'Your business received 12 new reviews this week!',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^email_sim_/);
    });

    it('should reject email missing recipient or subject', async () => {
      const result = await email.sendEmail({
        to: '',
        subject: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should format and dispatch low rating alert email to business owner', async () => {
      const result = await email.sendLowRatingAlert(
        'owner@cafe.com',
        'Grand Horizon Cafe',
        1,
        'Cold coffee and rude waiter',
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^email_sim_/);
    });
  });
});
