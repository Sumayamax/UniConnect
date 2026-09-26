import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

const statusLabels = {
  applied: 'Applied',
  under_review: 'Under Review',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
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

function CompanyDashboard({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await authenticatedFetch('/api/company/dashboard/')
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

  const recentApplications = dashboard?.recent_applications || []
  const statusCounts = dashboard?.applications_by_status || {}

  return (
    <main className="home dashboard-page">
      <h1>Company Dashboard</h1>
      <p>Overview of your opportunities and applications</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}

      {!loading && errors.length === 0 && dashboard && (
        <>
          <section className="dashboard-summary" aria-label="Opportunity summary">
            <div className="summary-card">
              <span>Total Opportunities</span>
              <strong>{dashboard.total_opportunities}</strong>
            </div>
            <div className="summary-card">
              <span>Active Opportunities</span>
              <strong>{dashboard.active_opportunities}</strong>
            </div>
            <div className="summary-card">
              <span>Closed Opportunities</span>
              <strong>{dashboard.closed_opportunities}</strong>
            </div>
            <div className="summary-card">
              <span>Total Applications</span>
              <strong>{dashboard.total_applications}</strong>
            </div>
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

          <section className="dashboard-section" aria-label="Recent applications">
            <h2>Recent Applications</h2>
            {recentApplications.length === 0 ? (
              <p className="api-status">No applications received yet.</p>
            ) : (
              <div className="recent-application-list">
                {recentApplications.map((application) => {
                  const fullName = [application.first_name, application.last_name]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <article className="recent-application-card" key={application.id}>
                      <div>
                        <h3>{fullName || displayValue(application.username)}</h3>
                        <p>{displayValue(application.username)}</p>
                      </div>
                      <dl>
                        <div>
                          <dt>Opportunity</dt>
                          <dd>{displayValue(application.opportunity_title)}</dd>
                        </div>
                        <div>
                          <dt>University</dt>
                          <dd>{displayValue(application.university)}</dd>
                        </div>
                        <div>
                          <dt>Major</dt>
                          <dd>{displayValue(application.major)}</dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd>{statusLabels[application.status] || application.status}</dd>
                        </div>
                        <div>
                          <dt>Applied</dt>
                          <dd>{displayValue(application.created_at)}</dd>
                        </div>
                      </dl>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}

      <nav className="page-nav dashboard-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('my-opportunities')}>
          My Opportunities
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('create-opportunity')}>
          Create Opportunity
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('applications-received')}>
          Applications Received
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>
          Home
        </button>
      </nav>
    </main>
  )
}

export default CompanyDashboard
