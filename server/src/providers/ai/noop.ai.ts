import type {
  IAiProvider,
  SentimentResult,
  ReviewResponseSuggestion,
} from '../types.js';

export class NoOpAiProvider implements IAiProvider {
  readonly name = 'noop';

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const trimmed = text.trim().toLowerCase();
    if (!trimmed) {
      return {
        sentiment: 'neutral',
        score: 0,
        tags: [],
      };
    }

    // Basic rule-based heuristic at ₹0 cost (no external API calls)
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'good', 'best', 'delicious', 'friendly', 'fast'];
    const negativeWords = ['bad', 'terrible', 'horrible', 'worst', 'slow', 'rude', 'cold', 'dirty', 'poor'];

    let posCount = 0;
    let negCount = 0;
    const detectedTags: string[] = [];

    for (const w of positiveWords) {
      if (trimmed.includes(w)) {
        posCount++;
        detectedTags.push(w);
      }
    }
    for (const w of negativeWords) {
      if (trimmed.includes(w)) {
        negCount++;
        detectedTags.push(w);
      }
    }

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let score = 0;

    if (posCount > negCount) {
      sentiment = 'positive';
      score = Math.min(1.0, 0.3 * posCount);
    } else if (negCount > posCount) {
      sentiment = 'negative';
      score = Math.max(-1.0, -0.3 * negCount);
    }

    return {
      sentiment,
      score,
      tags: detectedTags,
    };
  }

  async suggestResponse(
    _feedbackText: string,
    rating: number,
    businessName: string,
  ): Promise<ReviewResponseSuggestion> {
    if (rating >= 4) {
      return {
        suggestedResponse: `Thank you so much for taking the time to share your review! The entire team at ${businessName} is thrilled to know you had such a great experience. We look forward to welcoming you back soon!`,
        tone: 'warm',
      };
    }

    return {
      suggestedResponse: `Thank you for taking the time to provide your honest feedback regarding your visit to ${businessName}. We take pride in delivering an exceptional experience, and we apologize that we missed the mark. Your feedback has been shared with our management team so we can address this immediately.`,
      tone: 'apologetic',
    };
  }

  async summarizeFeedback(
    feedbacks: Array<{ text: string; rating: number }>,
  ): Promise<string> {
    if (!feedbacks || feedbacks.length === 0) {
      return 'No feedback available to summarize.';
    }

    const total = feedbacks.length;
    const avg = (
      feedbacks.reduce((sum, f) => sum + f.rating, 0) / total
    ).toFixed(1);

    return `Summary of ${total} customer review${total === 1 ? '' : 's'} (Average rating: ${avg}/5.0).`;
  }
}
