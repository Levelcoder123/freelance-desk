import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

export const updateMeSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  monthly_goal: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  se_tax_rate: z.number().min(0).max(100).optional(),
  timezone: z.string().max(50).optional(),
});
