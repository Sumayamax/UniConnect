import { useState } from 'react'

const commonItems = [
  { page: 'home', label: 'Overview', icon: '⌂' },
  { page: 'opportunities', label: 'Opportunities', icon: '◇' },
]

const roleItems = {
  student: [
    { page: 'student-dashboard', label: 'Dashboard', icon: '▦' },
    { page: 'student-profile', label: 'My Profile', icon: '◎' },
    { page: 'my-applications', label: 'My Applications', icon: '✓' },
    { page: 'my-portfolio', label: 'My Portfolio', icon: '▤' },
  ],
  company: [
    { page: 'company-dashboard', label: 'Dashboard', icon: '▦' },
    { page: 'company-profile', label: 'Company Profile', icon: '◎' },
    { page: 'create-opportunity', label: 'Create Opportunity', icon: '+' },
    { page: 'applications-received', label: 'Applications Received', icon: '↙' },
    { page: 'my-opportunities', label: 'My Opportunities', icon: '◇' },
  ],
  admin: [
    { page: 'admin-dashboard', label: 'Dashboard', icon: '▦' },
    { page: 'admin-users', label: 'Users', icon: '◎' },
    { page: 'admin-opportunities', label: 'Opportunities', icon: '◇' },
    { page: 'admin-companies', label: 'Companies', icon: '▤' },
    { page: 'admin-applications', label: 'Applications', icon: '✓' },
  ],
}

function AuthenticatedShell({
  page,
  user,
  onNavigate,
  onLogout,
  theme,
  onThemeChange,
  children,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const items = [...commonItems, ...(roleItems[user.role] || [])]
  const activePage = page === 'opportunity-details' ? 'opportunities' : page

  const navigate = (nextPage) => {
    setIsOpen(false)
    onNavigate(nextPage)
  }

  return (
    <div className={`app-shell theme-${theme} ${isOpen ? 'sidebar-open' : ''}`}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close navigation"
        onClick={() => setIsOpen(false)}
      />
      <aside id="primary-navigation" className="app-sidebar" aria-label="Primary navigation">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">UC</span>
          <span>UniConnect</span>
        </div>

        <div className="sidebar-user">
          <span className="sidebar-user-label">Workspace</span>
          <strong>{user.username}</strong>
          <span>{user.role}</span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Navigate</span>
          {items.map((item) => (
            <button
              type="button"
              className="sidebar-link"
              aria-current={activePage === item.page ? 'page' : undefined}
              key={item.page}
              onClick={() => navigate(item.page)}
            >
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="theme-toggle"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            onClick={onThemeChange}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === 'light' ? '☀' : '☾'}
            </span>
          </button>
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <span className="sidebar-icon" aria-hidden="true">↪</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="app-shell-main">
        <button
          type="button"
          className="sidebar-menu-button"
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span aria-hidden="true">☰</span>
          <span>Menu</span>
        </button>
        {children}
      </div>
    </div>
  )
}

export default AuthenticatedShell
