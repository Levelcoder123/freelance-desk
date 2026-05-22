import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import * as passwordResetService from '../services/passwordResetService.js';
import * as authValidation from '../validations/authValidation.js';

export const authRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── POST /auth/register
authRouter.post('/register', authLimiter, validate(authValidation.registerSchema), async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;

    const existing = await userService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await authService.hashPassword(password);
    const user = await userService.createUser({ full_name, email, password_hash });
    
    const { access, refresh } = authService.generateTokens(user.id);
    await authService.saveRefreshToken(user.id, refresh);

    res.status(201).json({ user, access_token: access, refresh_token: refresh });
  } catch (err) { next(err); }
});

// ── POST /auth/login
authRouter.post('/login', authLimiter, validate(authValidation.loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userService.findUserByEmail(email);
    if (!user || !(await authService.comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { access, refresh } = authService.generateTokens(user.id);
    await authService.saveRefreshToken(user.id, refresh);

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, access_token: access, refresh_token: refresh });
  } catch (err) { next(err); }
});

// ── GET /auth/me
authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// ── PATCH /auth/me
authRouter.patch('/me', authenticate, validate(authValidation.updateMeSchema), async (req, res, next) => {
  try {
    const allowed = ['full_name', 'email', 'monthly_goal', 'tax_rate', 'se_tax_rate', 'timezone'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    if (updates.email) {
      const existing = await userService.findUserByEmail(updates.email);
      if (existing && existing.id !== req.userId) {
          return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const user = await userService.updateUser(req.userId, updates);
    res.json(user);
  } catch (err) { next(err); }
});

// ── POST /auth/forgot-password
authRouter.post('/forgot-password', authLimiter, validate(authValidation.forgotPasswordSchema), async (req, res, next) => {
  const safeMessage = 'If that email is registered, a reset link has been sent.';

  try {
    const email = req.body.email.toLowerCase().trim();
    const user = await userService.findUserByEmail(email);

    if (!user) {
      return res.json({ message: safeMessage });
    }

    await passwordResetService.revokePreviousResetTokens(user.id);
    const token = await passwordResetService.createPasswordResetToken(user.id);

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    return res.json({ message: safeMessage });
  } catch (err) {
    console.error('[auth] forgot-password error:', err);
    next(err);
  }
});

// ── POST /auth/reset-password
authRouter.post('/reset-password', authLimiter, validate(authValidation.resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const resetToken = await passwordResetService.getValidPasswordResetToken(token);
    if (!resetToken) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    const passwordHash = await authService.hashPassword(password);
    await userService.updatePassword(resetToken.user_id, passwordHash);
    await passwordResetService.usePasswordResetToken(resetToken.id);
    await authService.revokeAllUserRefreshTokens(resetToken.user_id);

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

    const validToken = await authService.findValidRefreshToken(payload.sub, hash);
    if (!validToken) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    // Rotate: revoke old, issue new
    await authService.revokeRefreshToken(hash);
    const { access, refresh } = authService.generateTokens(payload.sub);
    await authService.saveRefreshToken(payload.sub, refresh);

    res.json({ access_token: access, refresh_token: refresh });
  } catch (err) { next(err); }
});

// ── POST /auth/logout
authRouter.post('/logout', authenticate, async (req, res, next) => {
  try {
    await authService.revokeAllUserRefreshTokens(req.userId);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});
