import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

const statusLabels = {
  applied: 'Applied',
  under_review: 'Under Review',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
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
        month: 'short',
        day: 'numeric',
      })
}

function formatApiError(status, data) {
  if (status === 403) {
    return 'You do not have permission to view this candidate.'
  }
  if (status === 404) {
    return 'Candidate not found or not associated with your company.'
  }
  if (typeof data?.detail === 'string') {
    return data.detail
  }
  return 'Could not load this candidate. Please try again.'
}

function CandidateProfile({ studentId, onNavigate, user }) {
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'company' || !studentId) {
      return
    }

    const loadCandidate = async () => {
      try {
        const response = await authenticatedFetch(
          `/api/company/candidates/${studentId}/`,
        )
        const data = await response.json()

        if (!response.ok) {
          setError(formatApiError(response.status, data))
          return
        }

        setCandidate(data)
        setError('')
      } catch {
        setError('Could not reach the server. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCandidate()
  }, [studentId, user])

  const accessError =
    user?.role !== 'company'
      ? 'Only company users can view candidate profiles.'
      : !studentId
        ? 'No candidate was selected.'
        : error

  if (loading) {
    if (accessError) {
      return (
        <main className="home candidate-profile-page">
          <section className="opportunity-detail-card profile-state" role="alert">
            <p className="opportunity-eyebrow">Candidate Profile</p>
            <h1>Unable to load candidate</h1>
            <p className="api-status error">{accessError}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate('applications-received')}
            >
              Back to Applications
            </button>
          </section>
        </main>
      )
    }

    return (
      <main className="home candidate-profile-page">
        <p className="api-status">Loading candidate profile...</p>
      </main>
    )
  }

  if (accessError) {
    return (
      <main className="home candidate-profile-page">
        <section className="opportunity-detail-card profile-state" role="alert">
          <p className="opportunity-eyebrow">Candidate Profile</p>
          <h1>Unable to load candidate</h1>
          <p className="api-status error">{accessError}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate('applications-received')}
          >
            Back to Applications
          </button>
        </section>
      </main>
    )
  }

  const profile = candidate.student_profile || {}
  const portfolio = Array.isArray(candidate.portfolio) ? candidate.portfolio : []
  const applications = Array.isArray(candidate.applications)
    ? candidate.applications
    : []
  const fullName = [candidate.user?.first_name, candidate.user?.last_name]
    .filter(Boolean)
    .join(' ')

  return (
    <main className="home candidate-profile-page">
      <section className="opportunity-detail-card candidate-profile-card">
        <div className="opportunity-detail-header">
          <div>
            <p className="opportunity-eyebrow">Candidate Profile</p>
            <h1>{displayValue(fullName || candidate.user?.username)}</h1>
            <p className="candidate-username">
              @{displayValue(candidate.user?.username)}
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate('applications-received')}
          >
            Back to Applications
          </button>
        </div>

        <section className="candidate-profile-section" aria-labelledby="student-information-heading">
          <h2 id="student-information-heading">Student Information</h2>
          <dl className="opportunity-detail-grid">
            <div>
              <dt>Username</dt>
              <dd>{displayValue(candidate.user?.username)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{displayValue(candidate.user?.email)}</dd>
            </div>
            <div>
              <dt>University</dt>
              <dd>{displayValue(profile.university)}</dd>
            </div>
            <div>
              <dt>Major</dt>
              <dd>{displayValue(profile.major)}</dd>
            </div>
            <div>
              <dt>Year of study</dt>
              <dd>{displayValue(profile.year_of_study)}</dd>
            </div>
            <div>
              <dt>Biography</dt>
              <dd>{displayValue(profile.bio)}</dd>
            </div>
          </dl>
          <div className="portfolio-links">
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            )}
            {!profile.github_url && !profile.linkedin_url && (
              <span className="api-status">No social links provided.</span>
            )}
          </div>
        </section>

        <section className="candidate-profile-section" aria-labelledby="skills-heading">
          <h2 id="skills-heading">Skills</h2>
          {profile.skills?.length ? (
            <div className="skill-list">
              {profile.skills.map((skill) => (
                <span className="skill-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="api-status">No skills listed.</p>
          )}
        </section>

        <section className="candidate-profile-section" aria-labelledby="portfolio-heading">
          <h2 id="portfolio-heading">Portfolio</h2>
          {portfolio.length ? (
            <div className="candidate-project-list">
              {portfolio.map((project) => (
                <article className="portfolio-card" key={project.id}>
                  <h3>{displayValue(project.title)}</h3>
                  <p>{displayValue(project.description)}</p>
                  <p className="project-technologies">
                    <strong>Technologies:</strong>{' '}
                    {displayValue(project.technologies)}
                  </p>
                  <div className="portfolio-links">
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                    )}
                    {project.project_url && (
                      <a href={project.project_url} target="_blank" rel="noreferrer">
                        Project link
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="api-status">No portfolio projects listed.</p>
          )}
        </section>

        <section className="candidate-profile-section" aria-labelledby="applications-heading">
          <h2 id="applications-heading">Applications to Your Company</h2>
          {applications.length ? (
            <div className="candidate-application-list">
              {applications.map((application) => (
                <article className="candidate-application-card" key={application.id}>
                  <div>
                    <h3>{displayValue(application.opportunity_title)}</h3>
                    <span
                      className={`application-badge status-${application.status}`}
                    >
                      {statusLabels[application.status] || application.status}
                    </span>
                  </div>
                  <p>Applied {formatDate(application.created_at)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="api-status">No applications found for this company.</p>
          )}
        </section>
      </section>
    </main>
  )
}

export default CandidateProfile
