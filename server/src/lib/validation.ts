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

// ── Types ───────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
