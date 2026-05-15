// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { styles } from './authStyles';

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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot Password</h1>

        {submitted ? (
          <div>
            <p style={{ ...styles.subtitle, color: '#4ade80', marginBottom: '1.5rem' }}>
              If that email is registered, a reset link is on its way. Check your inbox (and spam folder).
            </p>
            <Link to="/login" style={styles.link}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={styles.subtitle}>
              Enter your account email and we'll send you a reset link.
            </p>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <p style={styles.footerText}>
              <Link to="/login" style={styles.link}>Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
