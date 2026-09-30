import { env } from '../lib/env.js';
import type {
  IAiProvider,
  IMessagingProvider,
  IBillingProvider,
  IEmailProvider,
  ProvidersContainer,
} from './types.js';

import { NoOpAiProvider } from './ai/noop.ai.js';
import { ConsoleMessagingProvider } from './messaging/console.messaging.js';
import { FreeTierBillingProvider } from './billing/freetier.billing.js';
import { ConsoleEmailProvider } from './email/console.email.js';

// Re-export all types and provider implementations
export * from './types.js';
export { NoOpAiProvider } from './ai/noop.ai.js';
export { ConsoleMessagingProvider } from './messaging/console.messaging.js';
export { FreeTierBillingProvider } from './billing/freetier.billing.js';
export { ConsoleEmailProvider } from './email/console.email.js';

// ── Factory Resolution ──────────────────────────────────────

function createAiProvider(): IAiProvider {
  switch (env.AI_PROVIDER) {
    case 'noop':
    default:
      return new NoOpAiProvider();
  }
}

function createMessagingProvider(): IMessagingProvider {
  switch (env.MESSAGING_PROVIDER) {
    case 'console':
    default:
      return new ConsoleMessagingProvider();
  }
}

function createBillingProvider(): IBillingProvider {
  switch (env.BILLING_PROVIDER) {
    case 'free_tier':
    default:
      return new FreeTierBillingProvider();
  }
}

function createEmailProvider(): IEmailProvider {
  switch (env.EMAIL_PROVIDER) {
    case 'console':
    default:
      return new ConsoleEmailProvider();
  }
}

function initializeDefaultProviders(): ProvidersContainer {
  return {
    ai: createAiProvider(),
    messaging: createMessagingProvider(),
    billing: createBillingProvider(),
    email: createEmailProvider(),
  };
}

let activeProviders: ProvidersContainer = initializeDefaultProviders();

/**
 * Access the active singleton providers container
 */
export function getProviders(): ProvidersContainer {
  return activeProviders;
}

/**
 * Dynamically swap a provider (useful for unit testing or runtime plugin loading)
 */
export function setProvider<K extends keyof ProvidersContainer>(
  type: K,
  provider: ProvidersContainer[K],
): void {
  activeProviders[type] = provider;
}

/**
 * Reset providers to their environment-configured defaults
 */
export function resetProviders(): void {
  activeProviders = initializeDefaultProviders();
}
