import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

function formatApiErrors(data) {
  if (typeof data.detail === 'string') {
    return [data.detail]
  }

  const messages = []
  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      value.forEach((msg) => messages.push(`${field}: ${msg}`))
    } else if (typeof value === 'string') {
      messages.push(value)
    }
  }
  return messages.length ? messages : ['Something went wrong.']
}

function CompanyProfile({ onNavigate }) {
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState([])

  const updateFields = (data) => {
    setCompanyName(data.company_name || '')
    setDescription(data.description || '')
    setIndustry(data.industry || '')
    setLocation(data.location || '')
    setWebsite(data.website || '')
    setContactEmail(data.contact_email || '')
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authenticatedFetch('/api/company/profile/', {
        })
        const data = await response.json()

        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }

        updateFields(data)
        setErrors([])
      } catch {
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSuccess('')
    setErrors([])

    try {
      const response = await authenticatedFetch('/api/company/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName,
          description,
          industry,
          location,
          website,
          contact_email: contactEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors(formatApiErrors(data))
        return
      }

      updateFields(data)
      setSuccess('Profile saved successfully.')
    } catch {
      setErrors(['Could not reach the server. Please try again.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="home">
      <h1>Company Profile</h1>
      <p>Update your company profile</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && (
        <form className="register-form profile-form" onSubmit={handleSubmit}>
          <label>
            Company name
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </label>

          <label>
            Description
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label>
            Industry
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
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
            Website
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label>
            Contact email
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      )}

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
      </nav>
    </main>
  )
}

export default CompanyProfile
