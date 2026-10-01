import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

const opportunityTypeLabels = {
  internship: 'Internship',
  freelance: 'Freelance',
}

const workFormatLabels = {
  onsite: 'Onsite',
  remote: 'Remote',
  hybrid: 'Hybrid',
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

function AdminOpportunities({ onNavigate }) {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [errors, setErrors] = useState([])
  const [opportunityErrors, setOpportunityErrors] = useState({})

  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        const response = await authenticatedFetch('/api/admin/opportunities/')
        const data = await response.json()
        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }
        setOpportunities(Array.isArray(data) ? data : [])
        setErrors([])
      } catch {
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        setLoading(false)
      }
    }

    loadOpportunities()
  }, [])

  const updateStatus = async (opportunity) => {
    const nextActive = !opportunity.is_active
    if (!nextActive && !window.confirm(`Deactivate "${opportunity.title}"?`)) {
      return
    }

    setUpdatingId(opportunity.id)
    setOpportunityErrors((current) => ({ ...current, [opportunity.id]: '' }))
    try {
      const response = await authenticatedFetch(
        `/api/admin/opportunities/${opportunity.id}/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: nextActive }),
        },
      )
      const data = await response.json()
      if (!response.ok) {
        setOpportunityErrors((current) => ({
          ...current,
          [opportunity.id]: formatApiErrors(data).join(' '),
        }))
        return
      }
      setOpportunities((current) =>
        current.map((item) => item.id === opportunity.id ? data : item),
      )
    } catch {
      setOpportunityErrors((current) => ({
        ...current,
        [opportunity.id]: 'Could not reach the server. Please try again.',
      }))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="home dashboard-page admin-users-page">
      <h1>Opportunities</h1>
      <p>Moderate all UniConnect opportunities</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}

      {!loading && errors.length === 0 && opportunities.length === 0 && (
        <p className="api-status">No opportunities found.</p>
      )}

      {!loading && errors.length === 0 && opportunities.length > 0 && (
        <section className="admin-list" aria-label="All opportunities">
          {opportunities.map((opportunity) => (
            <article className="admin-list-card" key={opportunity.id}>
              <div>
                <h3>{opportunity.title}</h3>
                <p>{displayValue(opportunity.company_name)}</p>
              </div>
              <dl>
                <div><dt>Type</dt><dd>{opportunityTypeLabels[opportunity.opportunity_type] || opportunity.opportunity_type}</dd></div>
                <div><dt>Category</dt><dd>{displayValue(opportunity.category)}</dd></div>
                <div><dt>Location</dt><dd>{displayValue(opportunity.location)}</dd></div>
                <div><dt>Work format</dt><dd>{workFormatLabels[opportunity.work_format] || opportunity.work_format}</dd></div>
                <div><dt>Required skills</dt><dd>{opportunity.required_skills?.length ? opportunity.required_skills.join(', ') : 'Not specified'}</dd></div>
                <div><dt>Status</dt><dd>{opportunity.is_active ? 'Active' : 'Inactive'}</dd></div>
                <div><dt>Created</dt><dd>{displayValue(opportunity.created_at)}</dd></div>
              </dl>
              <div className="admin-user-actions">
                <button
                  type="button"
                  className={opportunity.is_active ? 'secondary-button' : 'apply-button'}
                  onClick={() => updateStatus(opportunity)}
                  disabled={updatingId === opportunity.id}
                >
                  {updatingId === opportunity.id
                    ? 'Updating...'
                    : opportunity.is_active ? 'Deactivate' : 'Restore'}
                </button>
              </div>
              {opportunityErrors[opportunity.id] && (
                <p className="api-status error admin-user-error">
                  {opportunityErrors[opportunity.id]}
                </p>
              )}
            </article>
          ))}
        </section>
      )}

      <nav className="page-nav dashboard-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('admin-dashboard')}>
          Dashboard
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>
          Home
        </button>
      </nav>
    </main>
  )
}

export default AdminOpportunities
