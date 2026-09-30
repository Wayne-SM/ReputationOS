import type {
  IBillingProvider,
  SubscriptionStatusResult,
} from '../types.js';

export class FreeTierBillingProvider implements IBillingProvider {
  readonly name = 'free_tier';

  async getSubscriptionStatus(
    _businessId: string,
  ): Promise<SubscriptionStatusResult> {
    // In MVP, businesses operate on free tier with core features enabled
    return {
      plan: 'free',
      status: 'active',
      canAddLocations: false,
      canExportReports: true,
      canUseAi: false,
    };
  }

  async createCheckoutSession(
    _businessId: string,
    _plan: string,
    returnUrl: string,
  ): Promise<{ checkoutUrl: string }> {
    return {
      checkoutUrl: `${returnUrl}?session=free_tier_active`,
    };
  }

  async createCustomerPortalSession(
    _businessId: string,
    returnUrl: string,
  ): Promise<{ portalUrl: string }> {
    return {
      portalUrl: returnUrl,
    };
  }
}
