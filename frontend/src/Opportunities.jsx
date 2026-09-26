import { useEffect, useRef, useState } from 'react'
import { authenticatedFetch } from './api.js'

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

function Opportunities({ onNavigate, user }) {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])
  const [search, setSearch] = useState('')
  const [opportunityType, setOpportunityType] = useState('')
  const [workFormat, setWorkFormat] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [skill, setSkill] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    opportunity_type: '',
    work_format: '',
    category: '',
    location: '',
    skill: '',
  })
  const [applyingId, setApplyingId] = useState(null)
  const [appliedIds, setAppliedIds] = useState(() => new Set())
  const [applyMessages, setApplyMessages] = useState({})
  const requestIdRef = useRef(0)
  const requestControllerRef = useRef(null)

  useEffect(() => {
    if (requestControllerRef.current) {
      requestControllerRef.current.abort()
    }

    const loadOpportunities = async () => {
      const requestId = ++requestIdRef.current
      const controller = new AbortController()
      requestControllerRef.current = controller
      setLoading(true)
      try {
        const params = new URLSearchParams()
        Object.entries(appliedFilters).forEach(([key, value]) => {
          const trimmedValue = value.trim()
          if (trimmedValue) {
            params.set(key, trimmedValue)
          }
        })
        const query = params.toString()
        const url = `/api/opportunities/${query ? `?${query}` : ''}`
        const response = await authenticatedFetch(url, {
          signal: controller.signal,
        })
        const data = await response.json()

        if (requestId !== requestIdRef.current) {
          return
        }

        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }

        setOpportunities(Array.isArray(data) ? data : [])
        setErrors([])
      } catch (error) {
        if (error.name === 'AbortError' || requestId !== requestIdRef.current) {
          return
        }
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }

    loadOpportunities()

    return () => {
      if (requestControllerRef.current) {
        requestControllerRef.current.abort()
      }
    }
  }, [appliedFilters])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setAppliedFilters((current) => {
        const next = {
          ...current,
          search: search.trim(),
          category: category.trim(),
          location: location.trim(),
          skill: skill.trim(),
        }
        return JSON.stringify(current) === JSON.stringify(next) ? current : next
      })
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [search, category, location, skill])

  const handleSelectFilter = (key, value) => {
    setAppliedFilters((current) => {
      const next = {
        ...current,
        search: search.trim(),
        category: category.trim(),
        location: location.trim(),
        skill: skill.trim(),
        [key]: value,
      }
      if (JSON.stringify(current) === JSON.stringify(next)) {
        return current
      }
      return next
    })
  }

  const handleClearFilters = () => {
    setSearch('')
    setOpportunityType('')
    setWorkFormat('')
    setCategory('')
    setLocation('')
    setSkill('')
    setSortBy('newest')
    setAppliedFilters({
      search: '',
      opportunity_type: '',
      work_format: '',
      category: '',
      location: '',
      skill: '',
    })
  }

  const sortedOpportunities = [...opportunities].sort((left, right) => {
    if (sortBy === 'best-match') {
      const matchDifference = (right.match_percentage || 0) - (left.match_percentage || 0)
      if (matchDifference !== 0) {
        return matchDifference
      }
    }

    return new Date(right.created_at) - new Date(left.created_at)
  })

  const handleApply = async (opportunityId) => {
    setApplyingId(opportunityId)
    setApplyMessages((current) => ({
      ...current,
      [opportunityId]: '',
    }))

    try {
      const response = await authenticatedFetch(
        `/api/opportunities/${opportunityId}/apply/`,
        {
          method: 'POST',
        },
      )
      const data = await response.json()

      if (!response.ok) {
        const [message] = formatApiErrors(data)
        setApplyMessages((current) => ({
          ...current,
          [opportunityId]: message,
        }))
        return
      }

      setAppliedIds((current) => new Set(current).add(opportunityId))
      setApplyMessages((current) => ({
        ...current,
        [opportunityId]: 'Applied successfully.',
      }))
    } catch {
      setApplyMessages((current) => ({
        ...current,
        [opportunityId]: 'Could not reach the server. Please try again.',
      }))
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <main className="home opportunities-page">
      <h1>Opportunities</h1>
      <p>Find internships and freelance opportunities</p>

      <div className="opportunity-filters">
        <label>
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Title, description, or requirements"
          />
        </label>

        <label>
          Opportunity type
          <select
            value={opportunityType}
            onChange={(event) => {
              const value = event.target.value
              setOpportunityType(value)
              handleSelectFilter('opportunity_type', value)
            }}
          >
            <option value="">All</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </select>
        </label>

        <label>
          Work format
          <select
            value={workFormat}
            onChange={(event) => {
              const value = event.target.value
              setWorkFormat(value)
              handleSelectFilter('work_format', value)
            }}
          >
            <option value="">All</option>
            <option value="onsite">Onsite</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>

        <label>
          Category
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </label>

        <label>
          Location
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </label>

        <label>
          Skill
          <input
            type="text"
            value={skill}
            onChange={(event) => setSkill(event.target.value)}
          />
        </label>

        <div className="filter-actions">
          <button type="button" className="filter-button secondary" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {user?.role === 'student' && (
        <label className="opportunity-sort">
          Sort by
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="best-match">Best Match</option>
          </select>
        </label>
      )}

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {!loading && errors.length === 0 && opportunities.length === 0 && (
        <p className="api-status">No opportunities available.</p>
      )}

      {!loading && errors.length === 0 && opportunities.length > 0 && (
        <section className="opportunity-list" aria-label="Available opportunities">
          {sortedOpportunities.map((opportunity) => (
            <article className="opportunity-card" key={opportunity.id}>
              <div className="opportunity-card-header">
                <div>
                  <h2>{opportunity.title}</h2>
                  <p className="opportunity-company">
                    {displayValue(opportunity.company_name)}
                  </p>
                </div>
                <span className="opportunity-type">{opportunity.opportunity_type}</span>
              </div>

              <p className="opportunity-description">{opportunity.description}</p>

              <dl className="opportunity-details">
                <div>
                  <dt>Required skills</dt>
                  <dd>
                    {opportunity.required_skills?.length ? (
                      <span className="skill-list">
                        {opportunity.required_skills.map((skill) => (
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
                  <dt>Category</dt>
                  <dd>{displayValue(opportunity.category)}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{displayValue(opportunity.location)}</dd>
                </div>
                <div>
                  <dt>Work format</dt>
                  <dd>{displayValue(opportunity.work_format)}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{displayValue(opportunity.duration)}</dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>{displayValue(opportunity.deadline)}</dd>
                </div>
                <div>
                  <dt>Compensation</dt>
                  <dd>{displayValue(opportunity.compensation)}</dd>
                </div>
              </dl>

              <div className="opportunity-requirements">
                <strong>Requirements</strong>
                <p>{displayValue(opportunity.requirements)}</p>
              </div>

              {user?.role === 'student' && (
                <div className="opportunity-matching">
                  <strong>{opportunity.match_percentage}% Match</strong>
                  <div className="matching-skills">
                    <span className="matching-label">Matched skills</span>
                    {opportunity.matched_skills?.length ? (
                      <span className="skill-list">
                        {opportunity.matched_skills.map((skill) => (
                          <span className="skill-tag matched-skill-tag" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="matching-empty">None matched</span>
                    )}
                  </div>
                  <div className="matching-skills">
                    <span className="matching-label">Missing skills</span>
                    {opportunity.missing_skills?.length ? (
                      <span className="skill-list">
                        {opportunity.missing_skills.map((skill) => (
                          <span className="skill-tag missing-skill-tag" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="matching-empty">All required skills matched</span>
                    )}
                  </div>
                </div>
              )}

              {user?.role === 'student' && (
                <div className="opportunity-apply">
                  <button
                    type="button"
                    className="apply-button"
                    onClick={() => handleApply(opportunity.id)}
                    disabled={applyingId === opportunity.id || appliedIds.has(opportunity.id)}
                  >
                    {appliedIds.has(opportunity.id)
                      ? 'Applied'
                      : applyingId === opportunity.id
                        ? 'Applying...'
                        : 'Apply'}
                  </button>
                  {applyMessages[opportunity.id] && (
                    <p
                      className={`api-status ${
                        appliedIds.has(opportunity.id) ? 'success' : 'error'
                      }`}
                    >
                      {applyMessages[opportunity.id]}
                    </p>
                  )}
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      <nav className="page-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>
          Home
        </button>
      </nav>
    </main>
  )
}

export default Opportunities
