import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

const statusLabels = {
  applied: 'Applied',
  under_review: 'Under Review',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
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

function StudentDashboard({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await authenticatedFetch('/api/student/dashboard/')
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
  const recommendedOpportunities = dashboard?.recommended_opportunities || []
  const statusCounts = dashboard?.applications_by_status || {}

  return (
    <main className="home dashboard-page">
      <h1>Student Dashboard</h1>
      <p>Track your applications and discover relevant opportunities</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}

      {!loading && errors.length === 0 && dashboard && (
        <>
          <section className="dashboard-summary" aria-label="Student summary">
            <div className="summary-card">
              <span>Total Applications</span>
              <strong>{dashboard.total_applications}</strong>
            </div>
            <div className="summary-card">
              <span>Portfolio Projects</span>
              <strong>{dashboard.portfolio_projects}</strong>
            </div>
            <div className="summary-card">
              <span>Skills</span>
              <strong>{dashboard.skills_count}</strong>
            </div>
            <div className="summary-card">
              <span>Accepted Applications</span>
              <strong>{statusCounts.accepted || 0}</strong>
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
              <p className="api-status">No applications yet.</p>
            ) : (
              <div className="recent-application-list">
                {recentApplications.map((application) => (
                  <article className="recent-application-card" key={application.id}>
                    <h3>{displayValue(application.opportunity_title)}</h3>
                    <dl>
                      <div>
                        <dt>Company</dt>
                        <dd>{displayValue(application.company_name)}</dd>
                      </div>
                      <div>
                        <dt>Type</dt>
                        <dd>{opportunityTypeLabels[application.opportunity_type] || application.opportunity_type}</dd>
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
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section" aria-label="Recommended opportunities">
            <h2>Recommended Opportunities</h2>
            {recommendedOpportunities.length === 0 ? (
              <p className="api-status">No recommended opportunities right now.</p>
            ) : (
              <div className="recommended-list">
                {recommendedOpportunities.map((opportunity) => (
                  <article className="opportunity-card recommended-card" key={opportunity.id}>
                    <div className="opportunity-card-header">
                      <div>
                        <h3>{opportunity.title}</h3>
                        <p className="opportunity-company">
                          {displayValue(opportunity.company_name)}
                        </p>
                      </div>
                      <strong className="match-score">{opportunity.match_percentage}% Match</strong>
                    </div>
                    <p className="recommended-type">
                      {opportunityTypeLabels[opportunity.opportunity_type] || opportunity.opportunity_type}
                    </p>
                    <div className="recommendation-skills">
                      <span className="matching-label">Required skills</span>
                      <span className="skill-list">
                        {opportunity.required_skills?.length ? opportunity.required_skills.map((skill) => (
                          <span className="skill-tag" key={skill}>{skill}</span>
                        )) : <span className="matching-empty">None specified</span>}
                      </span>
                    </div>
                    <div className="recommendation-skills">
                      <span className="matching-label">Matched skills</span>
                      <span className="skill-list">
                        {opportunity.matched_skills?.length ? opportunity.matched_skills.map((skill) => (
                          <span className="skill-tag matched-skill-tag" key={skill}>{skill}</span>
                        )) : <span className="matching-empty">None matched</span>}
                      </span>
                    </div>
                    <div className="recommendation-skills">
                      <span className="matching-label">Missing skills</span>
                      <span className="skill-list">
                        {opportunity.missing_skills?.length ? opportunity.missing_skills.map((skill) => (
                          <span className="skill-tag missing-skill-tag" key={skill}>{skill}</span>
                        )) : <span className="matching-empty">All required skills matched</span>}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <nav className="page-nav dashboard-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('opportunities')}>
          Browse Opportunities
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('my-applications')}>
          My Applications
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('my-portfolio')}>
          My Portfolio
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('student-profile')}>
          Student Profile
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>
          Home
        </button>
      </nav>
    </main>
  )
}

export default StudentDashboard
