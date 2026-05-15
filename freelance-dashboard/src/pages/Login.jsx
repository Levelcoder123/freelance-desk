import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '../hooks/useAuth'

const css = `
  .login-root {
    display: flex;
    min-height: 100vh;
    font-family: 'Geist', sans-serif;
    background: #f4ede3;
    overflow: hidden;
  }

  .login-left {
    width: 45%;
    min-width: 340px;
    background: #1c0f07;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .login-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 20% 80%, rgba(212,168,67,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 80% 10%, rgba(74,46,26,0.6) 0%, transparent 70%);
    pointer-events: none;
  }
  .login-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(212,168,67,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(212,168,67,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .login-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 1;
    animation: l-fadeUp 0.6s ease both;
  }
  .login-brand-icon {
    width: 40px;
    height: 40px;
    background: #d4a843;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .login-brand-icon svg {
    width: 22px;
    height: 22px;
    fill: #1c0f07;
  }
  .login-brand-name {
    font-weight: 500;
    font-size: 18px;
    color: #fff;
    letter-spacing: 0.01em;
  }

  .login-left-center {
    position: relative;
    z-index: 1;
    animation: l-fadeUp 0.6s 0.1s ease both;
  }
  .login-headline {
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-size: 52px;
    line-height: 1.1;
    color: #fff;
    margin: 0 0 20px;
    letter-spacing: 0;
  }
  .login-headline span { color: #d4a843; }
  .login-sub {
    font-size: 15px;
    color: rgba(255,255,255,0.4);
    line-height: 1.6;
    max-width: 300px;
  }

  .login-stats {
    display: flex;
    gap: 32px;
    margin-top: 36px;
  }
  .login-stat { display: flex; flex-direction: column; gap: 4px; }
  .login-stat-num {
    font-family: 'Geist Mono', monospace;
    font-size: 22px;
    font-weight: 500;
    color: #d4a843;
  }
  .login-stat-label {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .login-dots { display: flex; gap: 6px; margin-top: 24px; }
  .login-dot {
    height: 6px;
    border-radius: 3px;
    background: rgba(255,255,255,0.15);
  }
  .login-dot.active { width: 18px; background: #d4a843; }
  .login-dot:not(.active) { width: 6px; border-radius: 50%; }

  .login-quote {
    position: relative;
    z-index: 1;
    animation: l-fadeUp 0.6s 0.2s ease both;
  }
  .login-quote-mark {
    display: block;
    font-family: 'Instrument Serif', serif;
    font-size: 64px;
    line-height: 0.5;
    color: #d4a843;
    opacity: 0.4;
    margin-bottom: 10px;
  }
  .login-quote-text {
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-size: 16px;
    color: rgba(255,255,255,0.5);
    line-height: 1.6;
    margin-bottom: 12px;
  }
  .login-quote-author {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.22);
  }

  .login-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 72px;
    background: #f4ede3;
    position: relative;
  }
  .login-right::before {
    content: '';
    position: absolute;
    top: -80px;
    right: -80px;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .login-form-wrap {
    width: 100%;
    max-width: 380px;
    animation: l-fadeUp 0.7s 0.15s ease both;
  }

  .login-eyebrow {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d4a843;
    margin-bottom: 14px;
  }
  .login-heading {
    font-family: 'Instrument Serif', serif;
    font-size: 44px;
    line-height: 1.1;
    color: #1c0f07;
    margin: 0 0 8px;
    letter-spacing: 0;
  }
  .login-form-sub {
    font-size: 15px;
    color: #8c6e57;
    margin-bottom: 40px;
  }

  .login-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .login-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .login-label {
    font-size: 13px;
    font-weight: 500;
    color: #5a3e2b;
    letter-spacing: 0.01em;
  }
  .login-input {
    height: 50px;
    padding: 0 16px;
    background: #faf6f0;
    border: 1.5px solid #d9c9b8;
    border-radius: 10px;
    font-family: 'Geist', sans-serif;
    font-size: 15px;
    color: #1c0f07;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    width: 100%;
  }
  .login-input::placeholder { color: rgba(140,110,87,0.5); }
  .login-input:hover { border-color: #c4aa88; background: #fdf9f4; }
  .login-input:focus {
    border-color: #d4a843;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(212,168,67,0.14);
  }
  .login-input.error { border-color: #c0392b; }

  .login-forgot {
    font-size: 12px;
    color: #d4a843;
    font-weight: 500;
    text-decoration: none;
    transition: opacity 0.15s;
  }
  .login-forgot:hover { opacity: 0.7; }

  .login-error {
    background: rgba(192,57,43,0.08);
    border: 1px solid rgba(192,57,43,0.2);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13.5px;
    color: #a93226;
    margin-bottom: 16px;
  }

  .login-btn {
    width: 100%;
    height: 52px;
    background: #1c0f07;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'Geist', sans-serif;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.02em;
    cursor: pointer;
    margin-top: 8px;
    transition: background 0.2s, transform 0.1s, opacity 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    position: relative;
    overflow: hidden;
  }
  .login-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(212,168,67,0.15) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .login-btn:hover:not(:disabled) { background: #2e1a0d; }
  .login-btn:hover:not(:disabled)::after { opacity: 1; }
  .login-btn:active:not(:disabled) { transform: scale(0.99); }
  .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .login-btn svg {
    width: 16px;
    height: 16px;
    stroke: rgba(255,255,255,0.6);
    stroke-width: 2;
    fill: none;
    flex-shrink: 0;
  }

  .login-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: l-spin 0.7s linear infinite;
  }

  .login-signup-row {
    text-align: center;
    font-size: 13.5px;
    color: #8c6e57;
    margin-top: 28px;
  }
  .login-signup-row a {
    color: #1c0f07;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1.5px solid #d4a843;
    padding-bottom: 1px;
    transition: color 0.15s;
  }
  .login-signup-row a:hover { color: #d4a843; }

  @keyframes l-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes l-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .login-root { flex-direction: column; }
    .login-left {
      width: 100%;
      padding: 36px 32px;
      min-height: auto;
    }
    .login-headline { font-size: 36px; }
    .login-left-center { margin: 32px 0; }
    .login-stats { gap: 24px; }
    .login-right { padding: 48px 32px; }
    .login-heading { font-size: 34px; }
  }
`

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
    <>
      <style>{css}</style>
      <div className="login-root">
        <div className="login-left">
          <div className="login-grid" />

          <div className="login-brand">
            <div className="login-brand-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="3" width="8" height="8" rx="2" />
                <rect x="13" y="3" width="8" height="8" rx="2" />
                <rect x="3" y="13" width="8" height="8" rx="2" />
                <rect x="13" y="13" width="8" height="8" rx="2" />
              </svg>
            </div>
            <span className="login-brand-name">Freelance</span>
          </div>

          <div className="login-left-center">
            <h2 className="login-headline">
              Your work,<br />your <span>income,</span><br />your rules.
            </h2>
            <p className="login-sub">
              Everything a solo professional needs - clients, projects,
              invoices, and cash flow - in one clean workspace.
            </p>
            <div className="login-stats">
              <div className="login-stat">
                <span className="login-stat-num">PKR</span>
                <span className="login-stat-label">Multi-currency</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-num">PDF</span>
                <span className="login-stat-label">Auto invoices</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-num">∞</span>
                <span className="login-stat-label">Clients</span>
              </div>
            </div>
            <div className="login-dots">
              <div className="login-dot active" />
              <div className="login-dot" />
              <div className="login-dot" />
            </div>
          </div>

          <div className="login-quote">
            <span className="login-quote-mark">"</span>
            <p className="login-quote-text">
              The best way to get paid<br />is to send the invoice.
            </p>
            <span className="login-quote-author">- Every Freelancer, Eventually</span>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrap">
            <p className="login-eyebrow">Welcome back</p>
            <h1 className="login-heading">
              Sign in to<br />your workspace.
            </h1>
            <p className="login-form-sub">Pick up right where you left off.</p>

            {error && (
              <div className="login-error" role="alert">
                {getErrorMessage(error)}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  className={`login-input${error ? ' error' : ''}`}
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <div className="login-field-row">
                  <label className="login-label" htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
                </div>
                <input
                  id="password"
                  className={`login-input${error ? ' error' : ''}`}
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
                className="login-btn"
                disabled={isPending || !email || !password}
              >
                {isPending ? (
                  <div className="login-spinner" aria-label="Signing in..." />
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

            <p className="login-signup-row">
              New here? <Link to="/register">Create a free account</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
