import { z } from 'zod';

export const clientSchema = z.object({
  name:        z.string().min(1).max(255),
  company:     z.string().max(255).optional(),
  email:       z.string().email().optional().or(z.literal('')),
  phone:       z.string().max(50).optional(),
  address:     z.string().optional(),
  tags:        z.array(z.string()).optional().default([]),
  hourly_rate: z.number().min(0).optional(),
  status:      z.enum(['active','inactive']).default('active'),
  notes:       z.string().optional(),
});

export const updateSchema = clientSchema.partial();
