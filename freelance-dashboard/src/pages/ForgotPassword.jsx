// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container-simple">
      <div className="auth-card-simple">
        <h1 className="auth-card-title">Forgot Password</h1>

        {submitted ? (
          <div>
            <p className="auth-card-subtitle" style={{ color: '#4ade80', marginBottom: '1.5rem' }}>
              If that email is registered, a reset link is on its way. Check your inbox (and spam folder).
            </p>
            <Link to="/login" className="auth-card-link">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="auth-card-subtitle">
              Enter your account email and we'll send you a reset link.
            </p>

            {error && <p className="auth-alert">{error}</p>}

            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              className="auth-btn"
              type="submit"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <p className="auth-card-footer">
              <Link to="/login" className="auth-card-link">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
