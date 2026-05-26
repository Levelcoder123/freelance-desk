import { z } from 'zod';

export const projectSchema = z.object({
  clientId:    z.string().uuid().optional().nullable(),
  name:        z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status:      z.enum(['active','completed','paused','cancelled']).default('active'),
  priority:    z.enum(['low','medium','high','urgent']).default('medium'),
  progress:    z.number().int().min(0).max(100).default(0),
  deadline:    z.string().optional().nullable(),
  budget:      z.number().min(0).optional().nullable(),
});

export const updateSchema = projectSchema.partial();
