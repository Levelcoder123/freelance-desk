import { z } from 'zod';

export const invoiceSchema = z.object({
  client_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  invoice_number: z.string().min(1).max(50),
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']).default('draft'),
  amount: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  tax_rate: z.number().min(0).max(100).default(0),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(0),
    rate: z.number().min(0),
    amount: z.number().min(0),
  })).optional().default([]),
});

export const updateSchema = invoiceSchema.partial();
