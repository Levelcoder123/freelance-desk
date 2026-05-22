import { z } from 'zod';

export const CATEGORIES = ['Software','Hardware','Marketing','Education','Travel','Office','Other'];

export const expenseSchema = z.object({
  description:  z.string().min(1).max(255),
  amount:       z.number().min(0),
  currency:     z.string().length(3).default('USD'),
  category:     z.enum(CATEGORIES).default('Other'),
  expense_date: z.string().optional(),
  notes:        z.string().optional(),
});

export const updateSchema = expenseSchema.partial();
