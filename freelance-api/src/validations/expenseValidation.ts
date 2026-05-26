import { z } from 'zod';

export const CATEGORIES = ['Software','Hardware','Marketing','Education','Travel','Office','Other'] as const;

export const expenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount:      z.number().min(0),
  currency:    z.string().length(3).default('USD'),
  category:    z.enum(CATEGORIES).default('Other'),
  expenseDate: z.string().optional(),
  projectId:   z.string().uuid().optional().nullable(),
  notes:       z.string().optional().nullable(),
});

export const updateSchema = expenseSchema.partial();
