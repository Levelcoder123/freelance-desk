import { z } from 'zod';

export const updateProfileSchema = z.object({
    full_name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    monthly_goal: z.number().min(0).optional(),
    tax_rate: z.number().min(0).max(100).optional(),
    se_tax_rate: z.number().min(0).max(100).optional(),
    timezone: z.string().max(50).optional(),
});

export const changePasswordSchema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8),
});
