// src/pages/ResetPassword.tsx
// Reads ?token= from the URL, lets the user set a new password.
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import './Auth.css'

export default function ResetPassword() {
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get('token') || '';
  const navigate                = useNavigate();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-container-simple">
        <div className="auth-card-simple">
          <h1 className="auth-card-title">Password Updated</h1>
          <p className="auth-card-subtitle" style={{ color: '#4ade80' }}>
            Your password has been reset successfully. Redirecting you to login…
          </p>
          <Link to="/login" className="auth-card-link">Go to Login now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container-simple">
      <div className="auth-card-simple">
        <h1 className="auth-card-title">Reset Password</h1>

        {!token && (
          <p className="auth-alert">
            Invalid reset link. Please request a new one.{' '}
            <Link to="/forgot-password" className="auth-card-link">Try again</Link>
          </p>
        )}

        {error && <p className="auth-alert">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              required
            />
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={loading || !token}
            style={{ opacity: loading || !token ? 0.7 : 1 }}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
