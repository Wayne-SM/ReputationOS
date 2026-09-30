import { z } from 'zod';

// ── Registration ────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  name: z.string().trim().min(1, 'Name is required').max(255),
  businessName: z
    .string()
    .trim()
    .min(1, 'Business name is required')
    .max(255),
});

// ── Login ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Feedback Submission ─────────────────────────────────────

export const feedbackSubmissionSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  text: z.string().max(2000, 'Feedback must be under 2000 characters').optional().nullable(),
  source: z.enum(['reception', 'instagram', 'whatsapp', 'direct']).default('reception'),
  sessionId: z.string().uuid('Invalid session ID'),
  customerName: z.string().trim().max(255).optional().nullable(),
  customerEmail: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  customerPhone: z.string().trim().max(20).optional().nullable(),
  honeypot: z.string().max(0, 'Spam detected').optional(),
});

export const clickGoogleSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  source: z.enum(['reception', 'instagram', 'whatsapp', 'direct']).default('reception'),
});

// ── Types ───────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
export type ClickGoogleInput = z.infer<typeof clickGoogleSchema>;
