import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

const labels = {
  internship: 'Internship',
  freelance: 'Freelance',
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

function projectFields(opportunity) {
  return {
    title: opportunity.title || '',
    description: opportunity.description || '',
    requirements: opportunity.requirements || '',
    opportunity_type: opportunity.opportunity_type || 'internship',
    required_skills: Array.isArray(opportunity.required_skills)
      ? opportunity.required_skills.join(', ')
      : '',
    category: opportunity.category || '',
    location: opportunity.location || '',
    work_format: opportunity.work_format || 'onsite',
    duration: opportunity.duration || '',
    deadline: opportunity.deadline || '',
    compensation: opportunity.compensation || '',
    is_active: opportunity.is_active,
  }
}

function OpportunityForm({ fields, onChange, onSubmit, onCancel, saving }) {
  return (
    <form className="portfolio-edit-form" onSubmit={onSubmit}>
      <h2>Edit opportunity</h2>
      <label>
        Title
        <input
          type="text"
          value={fields.title}
          onChange={(event) => onChange('title', event.target.value)}
          required
        />
      </label>
      <label>
        Description
        <textarea
          rows="3"
          value={fields.description}
          onChange={(event) => onChange('description', event.target.value)}
          required
        />
      </label>
      <label>
        Requirements
        <textarea
          rows="3"
          value={fields.requirements}
          onChange={(event) => onChange('requirements', event.target.value)}
        />
      </label>
      <label>
        Opportunity type
        <select
          value={fields.opportunity_type}
          onChange={(event) => onChange('opportunity_type', event.target.value)}
        >
          <option value="internship">Internship</option>
          <option value="freelance">Freelance</option>
        </select>
      </label>
      <label>
        Required skills
        <input
          type="text"
          value={fields.required_skills}
          onChange={(event) => onChange('required_skills', event.target.value)}
          placeholder="Python, Django, SQL"
        />
      </label>
      <label>
        Category
        <input
          type="text"
          value={fields.category}
          onChange={(event) => onChange('category', event.target.value)}
        />
      </label>
      <label>
        Location
        <input
          type="text"
          value={fields.location}
          onChange={(event) => onChange('location', event.target.value)}
        />
      </label>
      <label>
        Work format
        <select
          value={fields.work_format}
          onChange={(event) => onChange('work_format', event.target.value)}
        >
          <option value="onsite">Onsite</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </label>
      <label>
        Duration
        <input
          type="text"
          value={fields.duration}
          onChange={(event) => onChange('duration', event.target.value)}
        />
      </label>
      <label>
        Deadline
        <input
          type="date"
          value={fields.deadline}
          onChange={(event) => onChange('deadline', event.target.value)}
        />
      </label>
      <label>
        Compensation
        <input
          type="text"
          value={fields.compensation}
          onChange={(event) => onChange('compensation', event.target.value)}
        />
      </label>
      <div className="portfolio-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function MyOpportunities({ onNavigate }) {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({})
  const [errors, setErrors] = useState([])
  const [cardErrors, setCardErrors] = useState({})

  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        const response = await authenticatedFetch('/api/company/opportunities/')
        const data = await response.json()
        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }
        setOpportunities(Array.isArray(data) ? data : [])
      } catch {
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        setLoading(false)
      }
    }

    loadOpportunities()
  }, [])

  const updateCard = async (opportunityId, payload, successMessage) => {
    setSavingId(opportunityId)
    setCardErrors((current) => ({ ...current, [opportunityId]: '' }))

    try {
      const response = await authenticatedFetch(
        `/api/company/opportunities/${opportunityId}/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await response.json()
      if (!response.ok) {
        setCardErrors((current) => ({
          ...current,
          [opportunityId]: formatApiErrors(data).join(' '),
        }))
        return false
      }

      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.id === opportunityId ? data : opportunity,
        ),
      )
      setCardErrors((current) => ({ ...current, [opportunityId]: successMessage }))
      return true
    } catch {
      setCardErrors((current) => ({
        ...current,
        [opportunityId]: 'Could not reach the server. Please try again.',
      }))
      return false
    } finally {
      setSavingId(null)
    }
  }

  const handleEditSubmit = async (event, opportunityId) => {
    event.preventDefault()
    const payload = {
      ...editFields,
      required_skills: editFields.required_skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      deadline: editFields.deadline || null,
    }
    if (await updateCard(opportunityId, payload, 'Opportunity updated successfully.')) {
      setEditingId(null)
    }
  }

  const handleToggleActive = (opportunity) => {
    updateCard(
      opportunity.id,
      { is_active: !opportunity.is_active },
      opportunity.is_active ? 'Opportunity closed.' : 'Opportunity reopened.',
    )
  }

  const handleDelete = async (opportunityId) => {
    if (!window.confirm('Delete this opportunity permanently?')) {
      return
    }

    setSavingId(opportunityId)
    setCardErrors((current) => ({ ...current, [opportunityId]: '' }))
    try {
      const response = await authenticatedFetch(
        `/api/company/opportunities/${opportunityId}/`,
        { method: 'DELETE' },
      )
      if (!response.ok) {
        const data = await response.json()
        setCardErrors((current) => ({
          ...current,
          [opportunityId]: formatApiErrors(data).join(' '),
        }))
        return
      }
      setOpportunities((current) =>
        current.filter((opportunity) => opportunity.id !== opportunityId),
      )
    } catch {
      setCardErrors((current) => ({
        ...current,
        [opportunityId]: 'Could not reach the server. Please try again.',
      }))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="home opportunities-page">
      <h1>My Opportunities</h1>
      <p>Manage your company opportunities</p>

      {loading && <p className="api-status">Loading...</p>}
      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
      {!loading && errors.length === 0 && opportunities.length === 0 && (
        <p className="api-status">No opportunities yet.</p>
      )}

      {!loading && errors.length === 0 && opportunities.length > 0 && (
        <section className="opportunity-list" aria-label="My opportunities">
          {opportunities.map((opportunity) => (
            <article className="opportunity-card" key={opportunity.id}>
              {editingId === opportunity.id ? (
                <OpportunityForm
                  fields={editFields}
                  onChange={(field, value) =>
                    setEditFields((current) => ({ ...current, [field]: value }))
                  }
                  onSubmit={(event) => handleEditSubmit(event, opportunity.id)}
                  onCancel={() => setEditingId(null)}
                  saving={savingId === opportunity.id}
                />
              ) : (
                <>
                  <div className="opportunity-card-header">
                    <div>
                      <h2>{opportunity.title}</h2>
                      <p className="opportunity-company">
                        {opportunity.is_active ? 'Active' : 'Closed'}
                      </p>
                    </div>
                    <span className="opportunity-type">
                      {labels[opportunity.opportunity_type] || opportunity.opportunity_type}
                    </span>
                  </div>
                  <dl className="opportunity-details">
                    <div><dt>Required skills</dt><dd>{opportunity.required_skills?.length ? opportunity.required_skills.join(', ') : 'Not specified'}</dd></div>
                    <div><dt>Category</dt><dd>{displayValue(opportunity.category)}</dd></div>
                    <div><dt>Location</dt><dd>{displayValue(opportunity.location)}</dd></div>
                    <div><dt>Work format</dt><dd>{labels[opportunity.work_format] || opportunity.work_format}</dd></div>
                    <div><dt>Deadline</dt><dd>{displayValue(opportunity.deadline)}</dd></div>
                    <div><dt>Compensation</dt><dd>{displayValue(opportunity.compensation)}</dd></div>
                  </dl>
                  <div className="portfolio-actions">
                    <button type="button" onClick={() => {
                      setEditingId(opportunity.id)
                      setEditFields(projectFields(opportunity))
                    }}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleToggleActive(opportunity)}
                      disabled={savingId === opportunity.id}
                    >
                      {savingId === opportunity.id
                        ? 'Saving...'
                        : opportunity.is_active ? 'Close' : 'Reopen'}
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleDelete(opportunity.id)}
                      disabled={savingId === opportunity.id}
                    >
                      {savingId === opportunity.id ? 'Working...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
              {cardErrors[opportunity.id] && (
                <p className={`api-status ${cardErrors[opportunity.id].includes('successfully') || cardErrors[opportunity.id].includes('closed') || cardErrors[opportunity.id].includes('reopened') ? 'success' : 'error'}`}>
                  {cardErrors[opportunity.id]}
                </p>
              )}
            </article>
          ))}
        </section>
      )}

      <nav className="page-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>
          Home
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('create-opportunity')}>
          Create Opportunity
        </button>
      </nav>
    </main>
  )
}

export default MyOpportunities
