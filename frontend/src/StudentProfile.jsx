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

function StudentProfile({ onNavigate }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [university, setUniversity] = useState('')
  const [major, setMajor] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [bio, setBio] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [skills, setSkills] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState([])

  useEffect(() => {
    authenticatedFetch('/api/student/profile/', {
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }

        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setUniversity(data.university || '')
        setMajor(data.major || '')
        setYearOfStudy(
          data.year_of_study === null || data.year_of_study === undefined
            ? ''
            : String(data.year_of_study),
        )
        setBio(data.bio || '')
        setGithubUrl(data.github_url || '')
        setLinkedinUrl(data.linkedin_url || '')
        setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : '')
        setErrors([])
      })
      .catch(() => {
        setErrors(['Could not reach the server. Please try again.'])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSuccess('')
    setErrors([])

    const skillList = skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    const payload = {
      first_name: firstName,
      last_name: lastName,
      university,
      major,
      year_of_study: yearOfStudy === '' ? null : Number(yearOfStudy),
      bio,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
      skills: skillList,
    }

    try {
      const response = await authenticatedFetch('/api/student/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors(formatApiErrors(data))
        return
      }

      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setUniversity(data.university || '')
      setMajor(data.major || '')
      setYearOfStudy(
        data.year_of_study === null || data.year_of_study === undefined
          ? ''
          : String(data.year_of_study),
      )
      setBio(data.bio || '')
      setGithubUrl(data.github_url || '')
      setLinkedinUrl(data.linkedin_url || '')
      setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : '')
      setSuccess('Profile saved successfully.')
    } catch {
      setErrors(['Could not reach the server. Please try again.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="home">
      <h1>My Profile</h1>
      <p>Update your student profile</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && (
        <form className="register-form profile-form" onSubmit={handleSubmit}>
          <label>
            First name
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>

          <label>
            Last name
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>

          <label>
            University
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
          </label>

          <label>
            Major
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
            />
          </label>

          <label>
            Year of study
            <input
              type="number"
              min="1"
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
            />
          </label>

          <label>
            Bio
            <textarea
              rows="4"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>

          <label>
            GitHub
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
            />
          </label>

          <label>
            LinkedIn
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </label>

          <label>
            Skills
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, Django, SQL"
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

export default StudentProfile
