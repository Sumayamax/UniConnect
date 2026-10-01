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

function AdminApplications({ onNavigate }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await authenticatedFetch('/api/admin/applications/')
        const data = await response.json()
        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }
        setApplications(Array.isArray(data) ? data : [])
        setErrors([])
      } catch {
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [])

  return (
    <main className="home dashboard-page admin-users-page">
      <h1>Applications</h1>
      <p>Review all applications across UniConnect</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}

      {!loading && errors.length === 0 && applications.length === 0 && (
        <p className="api-status">No applications found.</p>
      )}

      {!loading && errors.length === 0 && applications.length > 0 && (
        <section className="admin-list" aria-label="All applications">
          {applications.map((application) => (
            <article className="admin-list-card admin-application-card" key={application.id}>
              <div>
                <h3>{displayValue(application.opportunity_title)}</h3>
                <p>{displayValue(application.company_name)}</p>
                <span className={`application-badge status-${application.status}`}>
                  {statusLabels[application.status] || application.status}
                </span>
              </div>
              <dl>
                <div><dt>Student</dt><dd>{displayValue(application.username)}</dd></div>
                <div><dt>Full name</dt><dd>{[application.first_name, application.last_name].filter(Boolean).join(' ') || 'Not specified'}</dd></div>
                <div><dt>University</dt><dd>{displayValue(application.university)}</dd></div>
                <div><dt>Major</dt><dd>{displayValue(application.major)}</dd></div>
                <div><dt>Opportunity type</dt><dd>{displayValue(application.opportunity_type)}</dd></div>
                <div><dt>Opportunity status</dt><dd>{application.opportunity_is_active ? 'Active' : 'Inactive'}</dd></div>
                <div><dt>Created</dt><dd>{displayValue(application.created_at)}</dd></div>
                <div><dt>Updated</dt><dd>{displayValue(application.updated_at)}</dd></div>
              </dl>
            </article>
          ))}
        </section>
      )}

      <nav className="page-nav dashboard-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('admin-dashboard')}>Dashboard</button>
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>Home</button>
      </nav>
    </main>
  )
}

export default AdminApplications
