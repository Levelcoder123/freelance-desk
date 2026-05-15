import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/clients':   'Clients',
  '/invoices':  'Invoices',
  '/projects':  'Projects',
  '/expenses':  'Expenses',
  '/profile':   'Profile',
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)
  const logout   = useLogout()
  const { isDark, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const title    = PAGE_TITLES[location.pathname] ?? 'Freelance'
  const initials = user?.full_name
    ? user.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="sidebar-toggle" onClick={onMenuClick} aria-label="Open menu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span className="topbar-breadcrumb">Freelance</span>
        <span className="topbar-sep">/</span>
        <span className="topbar-title">{title}</span>
      </div>

      <div className="topbar-right">
        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="profile-wrap" ref={dropdownRef}>
          <button
            className="profile-btn"
            onClick={() => setOpen(o => !o)}
            aria-label="Profile menu"
            aria-expanded={open}
          >
            <div className="avatar">{initials}</div>
            <div className="profile-info">
              <span className="profile-name">{user?.full_name ?? 'Account'}</span>
              <span className="profile-email">{user?.email ?? ''}</span>
            </div>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.4 }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {open && (
            <div className="profile-dropdown">
              <button
                className="profile-dropdown-item"
                onClick={() => { setOpen(false); navigate('/profile') }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile & settings
              </button>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-dropdown-item profile-dropdown-danger"
                onClick={() => { setOpen(false); logout.mutate() }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}