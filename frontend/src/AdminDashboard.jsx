import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

const statusLabels = {
  applied: 'Applied',
  under_review: 'Under Review',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

const roleLabels = {
  student: 'Student',
  company: 'Company',
  admin: 'Admin',
}

const opportunityTypeLabels = {
  internship: 'Internship',
  freelance: 'Freelance',
}

function formatApiErrors(data) {
  if (typeof data?.detail === 'string') {
    return [data.detail]
  }

  const messages = []
  for (const [field, value] of Object.entries(data || {})) {
    if (Array.isArray(value)) {
      value.forEach((message) => messages.push(`${field}: ${message}`))
    } else if (typeof value === 'string') {
      messages.push(value)
    }
  }
  return messages.length ? messages : ['Something went wrong.']
}

function displayValue(value) {
  return value || 'Not specified'
}

function AdminDashboard({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await authenticatedFetch('/api/admin/dashboard/')
        const data = await response.json()
        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }
        setDashboard(data)
        setErrors([])
      } catch {
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const recentUsers = dashboard?.recent_users || []
  const recentOpportunities = dashboard?.recent_opportunities || []
  const statusCounts = dashboard?.applications_by_status || {}

  return (
    <main className="home dashboard-page">
      <h1>Admin Dashboard</h1>
      <p>Monitor UniConnect activity</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}

      {!loading && errors.length === 0 && dashboard && (
        <>
          <section className="dashboard-summary admin-summary" aria-label="Platform summary">
            <div className="summary-card"><span>Total Users</span><strong>{dashboard.total_users}</strong></div>
            <div className="summary-card"><span>Total Students</span><strong>{dashboard.total_students}</strong></div>
            <div className="summary-card"><span>Total Companies</span><strong>{dashboard.total_companies}</strong></div>
            <div className="summary-card"><span>Total Opportunities</span><strong>{dashboard.total_opportunities}</strong></div>
            <div className="summary-card"><span>Active Opportunities</span><strong>{dashboard.active_opportunities}</strong></div>
            <div className="summary-card"><span>Closed Opportunities</span><strong>{dashboard.closed_opportunities}</strong></div>
            <div className="summary-card"><span>Total Applications</span><strong>{dashboard.total_applications}</strong></div>
          </section>

          <section className="dashboard-section" aria-label="Applications by status">
            <h2>Applications by Status</h2>
            <div className="status-grid">
              {Object.entries(statusLabels).map(([status, label]) => (
                <div className="status-item" key={status}>
                  <span>{label}</span>
                  <strong>{statusCounts[status] || 0}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-section" aria-label="Recent users">
            <h2>Recent Users</h2>
            {recentUsers.length === 0 ? (
              <p className="api-status">No users yet.</p>
            ) : (
              <div className="admin-list">
                {recentUsers.map((user) => {
                  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
                  return (
                    <article className="admin-list-card" key={user.id}>
                      <div>
                        <h3>{user.username}</h3>
                        {fullName && <p>{fullName}</p>}
                      </div>
                      <dl>
                        <div><dt>Email</dt><dd>{displayValue(user.email)}</dd></div>
                        <div><dt>Role</dt><dd>{roleLabels[user.role] || user.role}</dd></div>
                        <div><dt>Status</dt><dd>{user.is_active ? 'Active' : 'Inactive'}</dd></div>
                        <div><dt>Date joined</dt><dd>{displayValue(user.date_joined)}</dd></div>
                      </dl>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="dashboard-section" aria-label="Recent opportunities">
            <h2>Recent Opportunities</h2>
            {recentOpportunities.length === 0 ? (
              <p className="api-status">No opportunities yet.</p>
            ) : (
              <div className="admin-list">
                {recentOpportunities.map((opportunity) => (
                  <article className="admin-list-card" key={opportunity.id}>
                    <div>
                      <h3>{opportunity.title}</h3>
                      <p>{displayValue(opportunity.company_name)}</p>
                    </div>
                    <dl>
                      <div><dt>Type</dt><dd>{opportunityTypeLabels[opportunity.opportunity_type] || opportunity.opportunity_type}</dd></div>
                      <div><dt>Status</dt><dd>{opportunity.is_active ? 'Active' : 'Closed'}</dd></div>
                      <div><dt>Created</dt><dd>{displayValue(opportunity.created_at)}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <nav className="page-nav dashboard-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>Home</button>
      </nav>
    </main>
  )
}

export default AdminDashboard
