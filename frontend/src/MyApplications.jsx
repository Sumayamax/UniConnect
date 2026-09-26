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
      value.forEach((msg) => messages.push(`${field}: ${msg}`))
    } else if (typeof value === 'string') {
      messages.push(value)
    }
  }
  return messages.length ? messages : ['Something went wrong.']
}

function displayValue(value) {
  return value || 'Not specified'
}

function MyApplications({ onNavigate }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await authenticatedFetch('/api/applications/', {
        })
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
    <main className="home opportunities-page">
      <h1>My Applications</h1>
      <p>Track your opportunity applications</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {!loading && errors.length === 0 && applications.length === 0 && (
        <p className="api-status">You have not applied to any opportunities yet.</p>
      )}

      {!loading && errors.length === 0 && applications.length > 0 && (
        <section className="opportunity-list" aria-label="My applications">
          {applications.map((application) => (
            <article className="opportunity-card application-card" key={application.id}>
              <div className="opportunity-card-header">
                <div>
                  <h2>{displayValue(application.opportunity_title)}</h2>
                  <p className="opportunity-company">
                    {displayValue(application.company_name)}
                  </p>
                </div>
                <span className="opportunity-type">
                  {displayValue(application.opportunity_type)}
                </span>
              </div>

              <dl className="opportunity-details">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className="application-status">
                      {statusLabels[application.status] || displayValue(application.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Applied on</dt>
                  <dd>{displayValue(application.created_at)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      )}

      <nav className="page-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>
          Home
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => onNavigate('opportunities')}
        >
          Opportunities
        </button>
      </nav>
    </main>
  )
}

export default MyApplications