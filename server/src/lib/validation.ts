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

// ── Business Settings ───────────────────────────────────────

export const updateBusinessSettingsSchema = z.object({
  name: z.string().trim().min(1, 'Business name cannot be empty').max(255).optional(),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Accent color must be a valid 6-character hex code (e.g. #2563eb)')
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  website: z.string().url('Invalid website URL').max(500).optional().nullable().or(z.literal('')),
  googleReviewUrl: z.string().url('Invalid Google review URL').max(500).optional().nullable().or(z.literal('')),
  googlePlaceId: z.string().max(255).optional().nullable(),
  feedbackWelcomeText: z.string().max(255).optional().nullable(),
  feedbackThankYouText: z.string().max(255).optional().nullable(),
  googleReviewCtaText: z.string().max(255).optional().nullable(),
});

// ── Types ───────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
export type ClickGoogleInput = z.infer<typeof clickGoogleSchema>;
export type UpdateBusinessSettingsInput = z.infer<typeof updateBusinessSettingsSchema>;

