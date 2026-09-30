import crypto from 'crypto';
import type {
  IEmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from '../types.js';

export class ConsoleEmailProvider implements IEmailProvider {
  readonly name = 'console';

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const { to, subject, text, html } = options;

    if (!to || !subject) {
      return {
        success: false,
        error: 'Missing required email fields (to, subject)',
      };
    }

    const messageId = `email_sim_${crypto.randomBytes(8).toString('hex')}`;

    console.log('\n[EmailProvider:Console] ==============================');
    console.log(`To:       ${to}`);
    console.log(`Subject:  ${subject}`);
    if (text) console.log(`Body:     ${text}`);
    if (html) console.log(`HTML:     ${html.slice(0, 100)}...`);
    console.log(`ID:       ${messageId}`);
    console.log('=======================================================\n');

    return {
      success: true,
      messageId,
    };
  }

  async sendLowRatingAlert(
    businessEmail: string,
    businessName: string,
    rating: number,
    text?: string,
  ): Promise<SendEmailResult> {
    const subject = `⚠️ Alert: ${rating}-Star Customer Feedback Received for ${businessName}`;
    const messageBody = [
      `Hello ${businessName} Team,`,
      '',
      `A customer recently submitted a ${rating}-star feedback entry on your Reputation OS page:`,
      text ? `"${text}"` : '(No written comments provided)',
      '',
      'You can review this submission in your Reputation OS dashboard.',
    ].join('\n');

    return this.sendEmail({
      to: businessEmail,
      subject,
      text: messageBody,
    });
  }
}
