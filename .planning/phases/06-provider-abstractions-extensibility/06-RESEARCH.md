# Phase 6: Technical Research — Provider Abstractions & Extensibility

## 1. Executive Summary
Reputation OS requires future expansion paths for paid and third-party capabilities (AI feedback analysis, WhatsApp review requests, Stripe subscriptions, and transactional emails) while maintaining an absolute ₹0 cost baseline in early testing. This research defines an interface-first provider architecture that isolates external SDKs behind TypeScript contracts.

## 2. Interface Contracts

### 2.1 AI Provider (`IAiProvider`)
```ts
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
  suggestResponse(feedbackText: string, rating: number, businessName: string): Promise<ReviewResponseSuggestion>;
  summarizeFeedback(feedbacks: Array<{ text: string; rating: number }>): Promise<string>;
}
```

### 2.2 Messaging Provider (`IMessagingProvider`)
```ts
export interface SendMessageOptions {
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
  sendReviewInvite(options: SendMessageOptions): Promise<SendMessageResult>;
}
```

### 2.3 Billing Provider (`IBillingProvider`)
```ts
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
  createCheckoutSession?(businessId: string, plan: string, returnUrl: string): Promise<{ checkoutUrl: string }>;
  createCustomerPortalSession?(businessId: string, returnUrl: string): Promise<{ portalUrl: string }>;
}
```

### 2.4 Email Provider (`IEmailProvider`)
```ts
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
  sendLowRatingAlert(businessEmail: string, businessName: string, rating: number, text?: string): Promise<SendEmailResult>;
}
```

## 3. Factory & Dependency Injection Pattern
- Providers are accessed via a central `getProviders()` export from `server/src/providers/index.ts`.
- Factory inspects environment variables:
  - `AI_PROVIDER`: `'noop'` (default)
  - `MESSAGING_PROVIDER`: `'console'` (default)
  - `BILLING_PROVIDER`: `'free_tier'` (default)
  - `EMAIL_PROVIDER`: `'console'` (default)
- In testing, providers can be dynamically injected or swapped using `setProvider()`, allowing unit tests to run without network calls or mocking external SDKs.
