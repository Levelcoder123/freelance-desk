import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
    ],
  },
  {
    label: 'Manage',
    links: [
      { to: '/clients',  label: 'Clients',  Icon: IconClients  },
      { to: '/projects', label: 'Projects', Icon: IconProjects },
      { to: '/invoices', label: 'Invoices', Icon: IconInvoices },
      { to: '/expenses', label: 'Expenses', Icon: IconExpenses },
    ],
  },
  {
    label: 'Settings',
    links: [
      { to: '/profile', label: 'Profile', Icon: IconProfile },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#1c1b18"/>
              <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#1c1b18"/>
              <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#1c1b18"/>
              <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#1c1b18" opacity="0.35"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-text">Freelance</div>
            <div className="sidebar-logo-sub">Workspace</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.links.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <span className="sidebar-icon"><Icon /></span>
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-meta">
            <span className="sidebar-footer-brand">Freelance Desk</span>
            <span className="sidebar-footer-version">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}

function IconDashboard() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}

function IconClients() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

function IconProjects() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
}

function IconInvoices() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}

function IconExpenses() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
}

function IconProfile() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}