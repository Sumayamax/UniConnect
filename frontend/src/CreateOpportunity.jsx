import { useState } from 'react'
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

function CreateOpportunity({ onNavigate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [opportunityType, setOpportunityType] = useState('internship')
  const [requiredSkills, setRequiredSkills] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [workFormat, setWorkFormat] = useState('onsite')
  const [duration, setDuration] = useState('')
  const [deadline, setDeadline] = useState('')
  const [compensation, setCompensation] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState([])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setSuccess('')
    setErrors([])

    const skillList = requiredSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    try {
      const response = await authenticatedFetch('/api/opportunities/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          requirements,
          opportunity_type: opportunityType,
          required_skills: skillList,
          category,
          location,
          work_format: workFormat,
          duration,
          deadline: deadline || null,
          compensation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors(formatApiErrors(data))
        return
      }

      setSuccess(`Opportunity "${data.title || title}" created successfully.`)
      setTitle('')
      setDescription('')
      setRequirements('')
      setOpportunityType('internship')
      setRequiredSkills('')
      setCategory('')
      setLocation('')
      setWorkFormat('onsite')
      setDuration('')
      setDeadline('')
      setCompensation('')
    } catch {
      setErrors(['Could not reach the server. Please try again.'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="home">
      <h1>Create Opportunity</h1>
      <p>Publish an internship or freelance opportunity</p>

      <form className="register-form profile-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label>
          Description
          <textarea
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <label>
          Requirements
          <textarea
            rows="4"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </label>

        <label>
          Opportunity type
          <select
            value={opportunityType}
            onChange={(e) => setOpportunityType(e.target.value)}
          >
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </select>
        </label>

        <label>
          Required skills
          <input
            type="text"
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="Python, Django, SQL"
          />
        </label>

        <label>
          Category
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>

        <label>
          Location
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>

        <label>
          Work format
          <select value={workFormat} onChange={(e) => setWorkFormat(e.target.value)}>
            <option value="onsite">Onsite</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>

        <label>
          Duration
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>

        <label>
          Deadline
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>

        <label>
          Compensation
          <input
            type="text"
            value={compensation}
            onChange={(e) => setCompensation(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create opportunity'}
        </button>
      </form>

      {loading && <p className="api-status">Loading...</p>}
      {success && <p className="api-status success">{success}</p>}

      {errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
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

export default CreateOpportunity
