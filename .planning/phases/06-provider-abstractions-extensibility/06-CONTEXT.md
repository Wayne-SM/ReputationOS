# Phase 6 Context: Provider Abstractions & Extensibility

## User Intent & Requirements
- **Milestone:** v1.0 — Lean MVP (₹0 Infrastructure Cost)
- **Goal:** Establish decoupled, pluggable provider interfaces for postponed external services (AI Insights, WhatsApp Messaging, Stripe Billing, Transactional Email) with zero-cost default local/No-Op implementations.
- **Key Philosophy:** "Build for ₹0 today, architect for seamless upgrade tomorrow." Future paid upgrades (e.g. OpenAI/Gemini, Twilio/WhatsApp, Stripe, Resend) can be swapped in via environment variables without modifying business domain code or database queries.

## Scope of Providers
1. **AI Provider (`IAiProvider`)**:
   - Capabilities: Sentiment analysis, feedback summarization, AI review response suggestion.
   - Default: `NoOpAiProvider` — returns neutral structured sentiment, empty summary, or generic polite templates at ₹0 cost.
   - Future Targets: OpenAI, Google Gemini, Anthropic.

2. **Messaging Provider (`IMessagingProvider`)**:
   - Capabilities: Send WhatsApp review request, dispatch template alert.
   - Default: `ConsoleMessagingProvider` — formats and logs messages to stdout/debug logger at ₹0 cost.
   - Future Targets: WhatsApp Cloud API, Twilio.

3. **Billing Provider (`IBillingProvider`)**:
   - Capabilities: Check business subscription tier, create checkout session URL, manage portal link.
   - Default: `FreeTierBillingProvider` — reports active status with `'free'` plan and unlimited usage allowances for MVP testing at ₹0 cost.
   - Future Targets: Stripe Billing.

4. **Email Provider (`IEmailProvider`)**:
   - Capabilities: Send verification emails, password reset tokens, low-rating alert notifications.
   - Default: `ConsoleEmailProvider` — logs recipient, subject, and token links directly to server console at ₹0 cost.
   - Future Targets: Resend, SendGrid, Amazon SES.

5. **Provider Registry / Factory**:
   - Centralized singleton container `getProviders()` configured by environment variables:
     `AI_PROVIDER`, `MESSAGING_PROVIDER`, `BILLING_PROVIDER`, `EMAIL_PROVIDER`.
