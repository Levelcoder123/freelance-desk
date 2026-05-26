import { z } from 'zod';

export const invoiceSchema = z.object({
  clientId:      z.string().uuid().optional().nullable(),
  projectId:     z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().min(1).max(50),
  status:        z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']).default('draft'),
  amount:        z.number().min(0),
  currency:      z.string().length(3).default('USD'),
  taxRate:       z.number().min(0).max(100).default(0),
  issueDate:     z.string().optional(),
  dueDate:       z.string().optional().nullable(),
  notes:         z.string().optional().nullable(),
  lineItems:     z.array(z.object({
    description: z.string(),
    quantity:    z.number().min(0),
    rate:        z.number().min(0),
    amount:      z.number().min(0),
  })).optional().default([]),
});

export const updateSchema = invoiceSchema.partial();
