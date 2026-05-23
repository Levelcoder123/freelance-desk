import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(err.message || 'Unhandled error', err);

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: 'Validation failed',
      issues: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });

  // Postgres unique violation
  if (err.code === '23505') return res.status(409).json({ error: 'Duplicate entry', detail: err.detail });

  // Postgres foreign key violation
  if (err.code === '23503') return res.status(400).json({ error: 'Referenced record not found' });

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}
