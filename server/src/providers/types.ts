// ============================================================
// Reputation OS — Provider Abstraction Contracts
// ============================================================

// ── AI Provider ─────────────────────────────────────────────

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1.0 to 1.0
  tags: string[];
}

export interface ReviewResponseSuggestion {
  suggestedResponse: string;
  tone: 'professional' | 'warm' | 'apologetic';
}

export interface IAiProvider {
  readonly name: string;
  analyzeSentiment(text: string): Promise<SentimentResult>;
  suggestResponse(
    feedbackText: string,
    rating: number,
    businessName: string,
  ): Promise<ReviewResponseSuggestion>;
  summarizeFeedback(
    feedbacks: Array<{ text: string; rating: number }>,
  ): Promise<string>;
}

// ── Messaging Provider (WhatsApp / SMS) ─────────────────────

export interface SendReviewInviteOptions {
  to: string; // phone number (E.164 format)
  customerName?: string;
  businessName: string;
  reviewLink: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  status: 'sent' | 'queued' | 'simulated' | 'failed';
  error?: string;
}

export interface IMessagingProvider {
  readonly name: string;
  sendReviewInvite(options: SendReviewInviteOptions): Promise<SendMessageResult>;
}

// ── Billing Provider (Stripe / Subscription) ────────────────

export interface SubscriptionStatusResult {
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  canAddLocations: boolean;
  canExportReports: boolean;
  canUseAi: boolean;
}

export interface IBillingProvider {
  readonly name: string;
  getSubscriptionStatus(businessId: string): Promise<SubscriptionStatusResult>;
  createCheckoutSession?(
    businessId: string,
    plan: string,
    returnUrl: string,
  ): Promise<{ checkoutUrl: string }>;
  createCustomerPortalSession?(
    businessId: string,
    returnUrl: string,
  ): Promise<{ portalUrl: string }>;
}

// ── Email Provider (Transactional / Alerts) ─────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  readonly name: string;
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
  sendLowRatingAlert(
    businessEmail: string,
    businessName: string,
    rating: number,
    text?: string,
  ): Promise<SendEmailResult>;
}

// ── Provider Container Map ──────────────────────────────────

export interface ProvidersContainer {
  ai: IAiProvider;
  messaging: IMessagingProvider;
  billing: IBillingProvider;
  email: IEmailProvider;
}
