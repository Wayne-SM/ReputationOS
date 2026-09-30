import crypto from 'crypto';
import type {
  IMessagingProvider,
  SendReviewInviteOptions,
  SendMessageResult,
} from '../types.js';

export class ConsoleMessagingProvider implements IMessagingProvider {
  readonly name = 'console';

  async sendReviewInvite(
    options: SendReviewInviteOptions,
  ): Promise<SendMessageResult> {
    const { to, customerName, businessName, reviewLink } = options;

    if (!to || !businessName || !reviewLink) {
      return {
        success: false,
        status: 'failed',
        error: 'Missing required messaging fields (to, businessName, reviewLink)',
      };
    }

    const greeting = customerName ? `Hi ${customerName}!` : 'Hi there!';
    const messageBody = `${greeting} Thank you for visiting ${businessName}. We value your experience and would love to hear your feedback: ${reviewLink}`;

    const messageId = `msg_sim_${crypto.randomBytes(8).toString('hex')}`;

    console.log('\n[MessagingProvider:Console] ==========================');
    console.log(`To:       ${to}`);
    console.log(`Message:  ${messageBody}`);
    console.log(`ID:       ${messageId}`);
    console.log('=======================================================\n');

    return {
      success: true,
      messageId,
      status: 'simulated',
    };
  }
}
