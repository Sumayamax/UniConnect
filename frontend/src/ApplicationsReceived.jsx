import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

const statusLabels = {
  applied: 'Applied',
  under_review: 'Under Review',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

const statusOptions = Object.keys(statusLabels)

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

function ApplicationsReceived({ onNavigate }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])
  const [updatingId, setUpdatingId] = useState(null)
  const [updateErrors, setUpdateErrors] = useState({})

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await authenticatedFetch('/api/company/applications/', {
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

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId)
    setUpdateErrors((current) => ({
      ...current,
      [applicationId]: '',
    }))

    try {
      const response = await authenticatedFetch(
        `/api/company/applications/${applicationId}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        },
      )
      const data = await response.json()

      if (!response.ok) {
        const [message] = formatApiErrors(data)
        setUpdateErrors((current) => ({
          ...current,
          [applicationId]: message,
        }))
        return
      }

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? { ...application, status: data.status }
            : application,
        ),
      )
    } catch {
      setUpdateErrors((current) => ({
        ...current,
        [applicationId]: 'Could not reach the server. Please try again.',
      }))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="home opportunities-page">
      <h1>Applications Received</h1>
      <p>Review applications for your opportunities</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {!loading && errors.length === 0 && applications.length === 0 && (
        <p className="api-status">No applications received yet.</p>
      )}

      {!loading && errors.length === 0 && applications.length > 0 && (
        <section className="opportunity-list" aria-label="Applications received">
          {applications.map((application) => {
            const fullName = [
              application.student_first_name,
              application.student_last_name,
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <article className="opportunity-card application-card" key={application.id}>
                <div className="opportunity-card-header">
                  <div>
                    <h2>{displayValue(application.opportunity_title)}</h2>
                    <p className="opportunity-company">
                      {displayValue(fullName)}
                    </p>
                  </div>
                  <label className="application-status-control">
                    <span className="visually-hidden">Application status</span>
                    <select
                      value={application.status}
                      onChange={(event) =>
                        handleStatusChange(application.id, event.target.value)
                      }
                      disabled={updatingId === application.id}
                    >
                      {statusOptions.map((status) => (
                        <option value={status} key={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <dl className="opportunity-details">
                  <div>
                    <dt>Username</dt>
                    <dd>{displayValue(application.student_username)}</dd>
                  </div>
                  <div>
                    <dt>University</dt>
                    <dd>{displayValue(application.student_university)}</dd>
                  </div>
                  <div>
                    <dt>Major</dt>
                    <dd>{displayValue(application.student_major)}</dd>
                  </div>
                  <div>
                    <dt>Skills</dt>
                    <dd>
                      {application.student_skills?.length ? (
                        <span className="skill-list">
                          {application.student_skills.map((skill) => (
                            <span className="skill-tag" key={skill}>
                              {skill}
                            </span>
                          ))}
                        </span>
                      ) : (
                        'Not specified'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Applied on</dt>
                    <dd>{displayValue(application.created_at)}</dd>
                  </div>
                </dl>

                {updateErrors[application.id] && (
                  <p className="api-status error application-update-error">
                    {updateErrors[application.id]}
                  </p>
                )}
              </article>
            )
          })}
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

export default ApplicationsReceived