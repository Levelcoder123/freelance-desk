import { z } from 'zod';

export const projectSchema = z.object({
  client_id:   z.string().uuid().optional(),
  name:        z.string().min(1).max(255),
  description: z.string().optional(),
  status:      z.enum(['active','completed','paused']).default('active'),
  priority:    z.enum(['low','medium','high']).default('medium'),
  progress:    z.number().int().min(0).max(100).default(0),
  deadline:    z.string().optional(),
  budget:      z.number().min(0).optional(),
});

export const updateSchema = projectSchema.partial();
