import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { query } from '../config/database.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

export const authRouter = Router();

// ── Schemas
const registerSchema = z.object({
  full_name: z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(8).max(72),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

const RESET_TOKEN_TTL_HOURS = 1;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Helpers
function generateTokens(userId) {
  const access = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refresh = jwt.sign(
    { sub: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' }
  );
  return { access, refresh };
}

async function saveRefreshToken(userId, token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens(user_id, token_hash, expires_at) VALUES($1,$2,$3)',
    [userId, hash, expiresAt]
  );
}

// ── POST /auth/register
authRouter.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;

    const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users(full_name, email, password_hash)
       VALUES($1,$2,$3)
       RETURNING id, full_name, email, plan, created_at`,
      [full_name, email, password_hash]
    );
    const user = rows[0];
    const { access, refresh } = generateTokens(user.id);
    await saveRefreshToken(user.id, refresh);

    res.status(201).json({ user, access_token: access, refresh_token: refresh });
  } catch (err) { next(err); }
});

// ── POST /auth/login
authRouter.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      'SELECT id, full_name, email, plan, password_hash FROM users WHERE email=$1',
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { access, refresh } = generateTokens(user.id);
    await saveRefreshToken(user.id, refresh);

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, access_token: access, refresh_token: refresh });
  } catch (err) { next(err); }
});

// ── POST /auth/forgot-password
// Always returns 200 for valid email-shaped requests to avoid user enumeration.
authRouter.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  const safeMessage = 'If that email is registered, a reset link has been sent.';

  try {
    const email = req.body.email.toLowerCase().trim();
    const { rows } = await query('SELECT id FROM users WHERE email=$1', [email]);

    if (rows.length === 0) {
      return res.json({ message: safeMessage });
    }

    const userId = rows[0].id;

    await query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    return res.json({ message: safeMessage });
  } catch (err) {
    console.error('[auth] forgot-password error:', err);
    next(err);
  }
});

// ── POST /auth/reset-password
authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const { rows } = await query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    const { id: tokenId, user_id: userId } = rows[0];
    const passwordHash = await bcrypt.hash(password, 12);

    await query(
      'UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2',
      [passwordHash, userId]
    );

    await query(
      'UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1',
      [tokenId]
    );

    await query(
      'UPDATE refresh_tokens SET revoked=true WHERE user_id=$1',
      [userId]
    );

    return res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('[auth] reset-password error:', err);
    next(err);
  }
});

// ── POST /auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const hash = crypto.createHash('sha256').update(refresh_token).digest('hex');

    const { rows } = await query(
      `SELECT id FROM refresh_tokens
       WHERE user_id=$1 AND token_hash=$2 AND revoked=false AND expires_at > NOW()`,
      [payload.sub, hash]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    // Rotate: revoke old, issue new
    await query('UPDATE refresh_tokens SET revoked=true WHERE token_hash=$1', [hash]);
    const { access, refresh } = generateTokens(payload.sub);
    await saveRefreshToken(payload.sub, refresh);

    res.json({ access_token: access, refresh_token: refresh });
  } catch (err) { next(err); }
});

// ── POST /auth/logout
authRouter.post('/logout', authenticate, async (req, res, next) => {
  try {
    await query('UPDATE refresh_tokens SET revoked=true WHERE user_id=$1', [req.userId]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// ── GET /auth/me
authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, full_name, email, plan, monthly_goal, tax_rate, se_tax_rate, timezone, created_at FROM users WHERE id=$1',
      [req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /auth/me  (update profile/settings)
authRouter.patch('/me', authenticate, async (req, res, next) => {
  try {
    const allowed = ['full_name','monthly_goal','tax_rate','se_tax_rate','timezone'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 2}`).join(', ');
    const values = Object.values(updates);

    const { rows } = await query(
      `UPDATE users SET ${fields} WHERE id=$1
       RETURNING id, full_name, email, plan, monthly_goal, tax_rate, se_tax_rate, timezone`,
      [req.userId, ...values]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});
