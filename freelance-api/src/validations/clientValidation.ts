import { z } from 'zod';

export const clientSchema = z.object({
  name:       z.string().min(1).max(255),
  company:    z.string().max(255).optional().nullable(),
  email:      z.string().email().optional().or(z.literal('')).nullable(),
  phone:      z.string().max(50).optional().nullable(),
  address:    z.string().optional().nullable(),
  tags:       z.array(z.string()).optional().default([]),
  hourlyRate: z.number().min(0).optional().nullable(),
  status:     z.enum(['active','inactive']).default('active'),
  notes:      z.string().optional().nullable(),
});

export const updateSchema = clientSchema.partial();
