import React from 'react'

const VARIANT_CLASS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
}
const SIZE_CLASS = { sm: 'btn-sm', md: '', lg: 'btn-lg', icon: 'btn-icon' }

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: keyof typeof VARIANT_CLASS;
  size?: keyof typeof SIZE_CLASS;
  loading?: boolean;
}

export default function Button({
  children,
  variant  = 'secondary',
  size     = 'md',
  disabled = false,
  loading  = false,
  onClick,
  type     = 'button',
  className = '',
  style = {},
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  const cls = [VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cls}
      style={style}
      aria-label={ariaLabel || (loading ? 'Loading…' : undefined)}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            width="13" height="13" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
            style={{ animation: 'spin 0.8s linear infinite' }}
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Loading…
        </>
      ) : children}
    </button>
  )
}

// Inject spin keyframe once
if (typeof document !== 'undefined' && !document.getElementById('btn-spin')) {
  const s = document.createElement('style')
  s.id = 'btn-spin'
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-primary, .btn-secondary, .btn-danger, .btn-ghost {
      transition: background-color 0.15s ease, opacity 0.15s ease, transform 0.1s ease;
    }
  `
  document.head.appendChild(s)
}
