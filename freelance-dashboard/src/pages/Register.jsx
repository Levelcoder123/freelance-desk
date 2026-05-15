import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { register } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { authPageCss } from './authStyles'

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Could not create your account. Please try again.'
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken)
      setUser(data.user)
      navigate('/dashboard')
    },
  })

  const set = field => e => setForm(current => ({ ...current, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <main className="auth-root">
      <style>{authPageCss}</style>
      <div className="auth-shell">
        <aside className="auth-story">
          <div className="auth-brand">
            <div className="auth-brand-mark">F</div>
            <span className="auth-brand-name">Freelance Dashboard</span>
          </div>
          <div className="auth-story-main">
            <h2 className="auth-story-title">Start with a <span>cleaner</span> freelance desk.</h2>
            <p className="auth-story-copy">
              Bring clients, projects, expenses, and invoices into one calm workspace built for daily use.
            </p>
          </div>
          <div className="auth-proof">
            <div className="auth-proof-item">
              <span className="auth-proof-value">PKR</span>
              <span className="auth-proof-label">Multi-currency ready</span>
            </div>
            <div className="auth-proof-item">
              <span className="auth-proof-value">PDF</span>
              <span className="auth-proof-label">Invoice exports</span>
            </div>
            <div className="auth-proof-item">
              <span className="auth-proof-value">24/7</span>
              <span className="auth-proof-label">Your records online</span>
            </div>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-form-card">
            <p className="auth-eyebrow">Create account</p>
            <h1 className="auth-title">Set up your workspace.</h1>
            <p className="auth-sub">Create your account and start organizing freelance work in minutes.</p>

            {mutation.error && (
              <div className="auth-alert" role="alert">{getErrorMessage(mutation.error)}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="full_name">Full name</label>
                <input
                  id="full_name"
                  type="text"
                  placeholder="Jane Cooper"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={set('full_name')}
                  required
                  minLength={2}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                />
              </div>
              <p className="auth-help">Use 8 or more characters.</p>

              <button
                className="auth-btn"
                type="submit"
                disabled={mutation.isPending || !form.full_name || !form.email || form.password.length < 8}
              >
                {mutation.isPending ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
