import { useEffect, useState } from 'react'
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

function MyPortfolio({ onNavigate }) {
  const [projects, setProjects] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({})
  const [editingSaving, setEditingSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [projectErrors, setProjectErrors] = useState({})

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await authenticatedFetch('/api/student/portfolio/', {
        })
        const data = await response.json()

        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }

        setProjects(Array.isArray(data) ? data : [])
        setErrors([])
      } catch {
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSuccess('')
    setErrors([])

    try {
      const response = await authenticatedFetch('/api/student/portfolio/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          project_url: projectUrl,
          github_url: githubUrl,
          technologies,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setErrors(formatApiErrors(data))
        return
      }

      setProjects((current) => [data, ...current])
      setTitle('')
      setDescription('')
      setProjectUrl('')
      setGithubUrl('')
      setTechnologies('')
      setSuccess('Project added to your portfolio successfully.')
    } catch {
      setErrors(['Could not reach the server. Please try again.'])
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (project) => {
    setEditingId(project.id)
    setEditFields({
      title: project.title || '',
      description: project.description || '',
      project_url: project.project_url || '',
      github_url: project.github_url || '',
      technologies: project.technologies || '',
    })
    setProjectErrors((current) => ({ ...current, [project.id]: '' }))
  }

  const handleEditSubmit = async (event, projectId) => {
    event.preventDefault()
    setEditingSaving(true)
    setProjectErrors((current) => ({ ...current, [projectId]: '' }))

    try {
      const response = await authenticatedFetch(
        `/api/student/portfolio/${projectId}/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFields),
        },
      )
      const data = await response.json()

      if (!response.ok) {
        setProjectErrors((current) => ({
          ...current,
          [projectId]: formatApiErrors(data).join(' '),
        }))
        return
      }

      setProjects((current) =>
        current.map((project) => (project.id === projectId ? data : project)),
      )
      setEditingId(null)
      setSuccess('Project updated successfully.')
    } catch {
      setProjectErrors((current) => ({
        ...current,
        [projectId]: 'Could not reach the server. Please try again.',
      }))
    } finally {
      setEditingSaving(false)
    }
  }

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this portfolio project?')) {
      return
    }

    setDeletingId(projectId)
    setProjectErrors((current) => ({ ...current, [projectId]: '' }))

    try {
      const response = await authenticatedFetch(
        `/api/student/portfolio/${projectId}/`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        const data = await response.json()
        setProjectErrors((current) => ({
          ...current,
          [projectId]: formatApiErrors(data).join(' '),
        }))
        return
      }

      setProjects((current) => current.filter((project) => project.id !== projectId))
      if (editingId === projectId) {
        setEditingId(null)
      }
      setSuccess('Project deleted successfully.')
    } catch {
      setProjectErrors((current) => ({
        ...current,
        [projectId]: 'Could not reach the server. Please try again.',
      }))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="home portfolio-page">
      <h1>My Portfolio</h1>
      <p>Showcase your projects and technical experience</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && (
        <section className="portfolio-projects" aria-label="Portfolio projects">
          {projects.length === 0 ? (
            <p className="api-status">No portfolio projects yet.</p>
          ) : (
            projects.map((project) => (
              <article className="portfolio-card" key={project.id}>
                {editingId === project.id ? (
                  <form
                    className="portfolio-edit-form"
                    onSubmit={(event) => handleEditSubmit(event, project.id)}
                  >
                    <h2>Edit project</h2>
                    <label>
                      Title
                      <input
                        type="text"
                        value={editFields.title || ''}
                        onChange={(event) =>
                          setEditFields({ ...editFields, title: event.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        rows="3"
                        value={editFields.description || ''}
                        onChange={(event) =>
                          setEditFields({ ...editFields, description: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Project URL
                      <input
                        type="url"
                        value={editFields.project_url || ''}
                        onChange={(event) =>
                          setEditFields({ ...editFields, project_url: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      GitHub URL
                      <input
                        type="url"
                        value={editFields.github_url || ''}
                        onChange={(event) =>
                          setEditFields({ ...editFields, github_url: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Technologies
                      <textarea
                        rows="2"
                        value={editFields.technologies || ''}
                        onChange={(event) =>
                          setEditFields({ ...editFields, technologies: event.target.value })
                        }
                      />
                    </label>
                    <div className="portfolio-actions">
                      <button type="submit" disabled={editingSaving}>
                        {editingSaving ? 'Saving...' : 'Save changes'}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setEditingId(null)}
                        disabled={editingSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2>{project.title}</h2>
                    <p>{displayValue(project.description)}</p>
                    <p className="portfolio-technologies">
                      <strong>Technologies:</strong> {displayValue(project.technologies)}
                    </p>
                    <div className="portfolio-links">
                      {project.project_url && (
                        <a href={project.project_url} target="_blank" rel="noreferrer">
                          View project
                        </a>
                      )}
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noreferrer">
                          GitHub
                        </a>
                      )}
                    </div>
                    <div className="portfolio-actions">
                      <button type="button" onClick={() => startEditing(project)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                      >
                        {deletingId === project.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </>
                )}
                {projectErrors[project.id] && (
                  <p className="api-status error">{projectErrors[project.id]}</p>
                )}
              </article>
            ))
          )}
        </section>
      )}

      <form className="register-form profile-form" onSubmit={handleSubmit}>
        <h2>Add a project</h2>
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <label>
          Description
          <textarea
            rows="4"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label>
          Project URL
          <input
            type="url"
            value={projectUrl}
            onChange={(event) => setProjectUrl(event.target.value)}
            placeholder="https://example.com/project"
          />
        </label>

        <label>
          GitHub URL
          <input
            type="url"
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            placeholder="https://github.com/username/project"
          />
        </label>

        <label>
          Technologies
          <textarea
            rows="3"
            value={technologies}
            onChange={(event) => setTechnologies(event.target.value)}
            placeholder="React, Django, PostgreSQL"
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Adding project...' : 'Add project'}
        </button>
      </form>

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

export default MyPortfolio
