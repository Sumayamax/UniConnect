import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'
import MatchRing from './MatchRing.jsx'

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

function formatDate(value) {
  if (!value) {
    return 'Not specified'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
}

function OpportunityDetails({ opportunityId, onNavigate, user }) {
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])
  const [applying, setApplying] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applicationError, setApplicationError] = useState('')
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    let active = true

    const loadOpportunity = async () => {
      setLoading(true)
      setErrors([])
      try {
        const response = await authenticatedFetch(`/api/opportunities/${opportunityId}/`)
        const data = await response.json()
        if (!active) {
          return
        }

        if (!response.ok) {
          setErrors(response.status === 404
            ? ['This opportunity is no longer available.']
            : formatApiErrors(data))
          return
        }

        setOpportunity(data)
      } catch {
        if (active) {
          setErrors(['Could not reach the server. Please try again.'])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadOpportunity()
    return () => {
      active = false
    }
  }, [opportunityId])

  const handleApply = async () => {
    setApplying(true)
    setApplicationMessage('')
    setApplicationError('')

    try {
      const response = await authenticatedFetch(
        `/api/opportunities/${opportunityId}/apply/`,
        { method: 'POST' },
      )
      const data = await response.json()

      if (!response.ok) {
        setApplicationError(formatApiErrors(data).join(' '))
        return
      }

      setApplied(true)
      setApplicationMessage('Application submitted successfully.')
    } catch {
      setApplicationError('Could not reach the server. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <main className="home opportunities-page opportunity-details-page">
      <nav className="page-nav opportunity-details-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('opportunities')}>
          Back to Opportunities
        </button>
      </nav>

      {loading && <p className="api-status">Loading opportunity...</p>}

      {!loading && errors.length > 0 && (
        <section className="opportunity-state" aria-live="polite">
          <h1>Opportunity unavailable</h1>
          {errors.map((error) => <p className="api-status error" key={error}>{error}</p>)}
        </section>
      )}

      {!loading && errors.length === 0 && opportunity && (
        <article className="opportunity-detail-card opportunity-detail-enter">
          <header className="opportunity-detail-header">
            <div>
              <p className="opportunity-eyebrow">
                {opportunityTypeLabels[opportunity.opportunity_type] || opportunity.opportunity_type}
              </p>
              <h1>{opportunity.title}</h1>
              <p className="opportunity-company">{displayValue(opportunity.company_name)}</p>
            </div>
            {user?.role === 'student' && (
              <MatchRing value={opportunity.match_percentage} size={92} />
            )}
          </header>

          <section className="opportunity-detail-section">
            <h2>Description</h2>
            <p>{displayValue(opportunity.description)}</p>
          </section>

          <section className="opportunity-detail-section">
            <h2>Requirements</h2>
            <p>{displayValue(opportunity.requirements)}</p>
          </section>

          <dl className="opportunity-detail-grid">
            <div><dt>Required skills</dt><dd><span className="skill-list">{opportunity.required_skills?.length ? opportunity.required_skills.map((skill) => <span className="skill-tag" key={skill}>{skill}</span>) : 'Not specified'}</span></dd></div>
            <div><dt>Category</dt><dd>{displayValue(opportunity.category)}</dd></div>
            <div><dt>Location</dt><dd>{displayValue(opportunity.location)}</dd></div>
            <div><dt>Work format</dt><dd>{workFormatLabels[opportunity.work_format] || displayValue(opportunity.work_format)}</dd></div>
            <div><dt>Duration</dt><dd>{displayValue(opportunity.duration)}</dd></div>
            <div><dt>Deadline</dt><dd>{formatDate(opportunity.deadline)}</dd></div>
            <div><dt>Compensation</dt><dd>{displayValue(opportunity.compensation)}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(opportunity.created_at)}</dd></div>
          </dl>

          {user?.role === 'student' && (
            <section className="opportunity-matching detail-matching">
              <h2>Smart Match</h2>
              <p className="matching-intro">A skills-based view of how this opportunity fits your profile.</p>
              <div className="matching-skills">
                <span className="matching-label">Matched skills</span>
                {opportunity.matched_skills?.length ? (
                  <span className="skill-list">{opportunity.matched_skills.map((skill, index) => (
                    <span
                      className="skill-tag matched-skill-tag"
                      key={skill}
                      style={{ '--skill-index': index }}
                    >
                      {skill}
                    </span>
                  ))}</span>
                ) : <span className="matching-empty">None matched</span>}
              </div>
              <div className="matching-skills">
                <span className="matching-label">Missing skills</span>
                {opportunity.missing_skills?.length ? (
                  <span className="skill-list">{opportunity.missing_skills.map((skill) => <span className="skill-tag missing-skill-tag" key={skill}>{skill}</span>)}</span>
                ) : <span className="matching-empty">All required skills matched</span>}
              </div>
            </section>
          )}

          {user?.role === 'student' && (
            <div className="opportunity-apply detail-apply">
              <button
                type="button"
                className="apply-button"
                onClick={handleApply}
                disabled={applying || applied}
              >
                {applied ? 'Applied' : applying ? 'Applying...' : 'Apply'}
              </button>
              {applicationMessage && <p className="api-status success">{applicationMessage}</p>}
              {applicationError && <p className="api-status error">{applicationError}</p>}
            </div>
          )}
        </article>
      )}
    </main>
  )
}

export default OpportunityDetails