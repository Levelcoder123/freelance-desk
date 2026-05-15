const VARIANT_CLASS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
}
const SIZE_CLASS = { sm: 'btn-sm', md: '', lg: 'btn-lg', icon: 'btn-icon' }

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
  ...props
}) {
  const cls = [VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cls}
      style={style}
      {...props}
    >
      {loading ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
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
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(s)
}
