import { NavLink } from 'react-router-dom'
import { IconDashboard, IconClients, IconProjects, IconInvoices, IconExpenses, IconProfile } from '../ui/Icons'

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
