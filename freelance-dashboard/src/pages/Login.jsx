import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '../hooks/useAuth'
import './Login.css'

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Invalid email or password. Please try again.'
  )
}

export default function Login() {
  const { mutate: login, isPending, error } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (document.getElementById('freelance-fonts')) return

    const link = document.createElement('link')
    link.id = 'freelance-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap'
    document.head.appendChild(link)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    login({ email, password })
  }

  return (
    <div className="lgn-root">
      <div className="lgn-left">
        <div className="lgn-grid" />

        <div className="lgn-brand">
          <div className="lgn-brand-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="2" />
              <rect x="13" y="3" width="8" height="8" rx="2" />
              <rect x="3" y="13" width="8" height="8" rx="2" />
              <rect x="13" y="13" width="8" height="8" rx="2" />
            </svg>
          </div>
          <span className="lgn-brand-name">Freelance</span>
        </div>

        <div className="lgn-left-center">
          <h2 className="lgn-headline">
            Your work,<br />your <span>income,</span><br />your rules.
          </h2>
          <p className="lgn-sub">
            Everything a solo professional needs - clients, projects,
            invoices, and cash flow - in one clean workspace.
          </p>
          <div className="lgn-stats">
            <div className="lgn-stat">
              <span className="lgn-stat-num">PKR</span>
              <span className="lgn-stat-label">Multi-currency</span>
            </div>
            <div className="lgn-stat">
              <span className="lgn-stat-num">PDF</span>
              <span className="lgn-stat-label">Auto invoices</span>
            </div>
            <div className="lgn-stat">
              <span className="lgn-stat-num">∞</span>
              <span className="lgn-stat-label">Clients</span>
            </div>
          </div>
          <div className="lgn-dots">
            <div className="lgn-dot active" />
            <div className="lgn-dot" />
            <div className="lgn-dot" />
          </div>
        </div>

        <div className="lgn-quote">
          <span className="lgn-quote-mark">"</span>
          <p className="lgn-quote-text">
            The best way to get paid<br />is to send the invoice.
          </p>
          <span className="lgn-quote-author">- Every Freelancer, Eventually</span>
        </div>
      </div>

      <div className="lgn-right">
        <div className="lgn-form-wrap">
          <p className="lgn-eyebrow">Welcome back</p>
          <h1 className="lgn-heading">
            Sign in to<br />your workspace.
          </h1>
          <p className="lgn-form-sub">Pick up right where you left off.</p>

          {error && (
            <div className="lgn-error" role="alert">
              {getErrorMessage(error)}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="lgn-field">
              <label className="lgn-label" htmlFor="email">Email address</label>
              <input
                id="email"
                className={`lgn-input${error ? ' error' : ''}`}
                type="email"
                placeholder="jane@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="lgn-field">
              <div className="lgn-field-row">
                <label className="lgn-label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="lgn-forgot">Forgot password?</Link>
              </div>
              <input
                id="password"
                className={`lgn-input${error ? ' error' : ''}`}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="lgn-btn"
              disabled={isPending || !email || !password}
            >
              {isPending ? (
                <div className="lgn-spinner" aria-label="Signing in..." />
              ) : (
                <>
                  Sign in
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="13 6 19 12 13 18" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="lgn-signup-row">
            New here? <Link to="/register">Create a free account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
