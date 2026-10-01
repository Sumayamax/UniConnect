import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

const roleLabels = {
  student: 'Student',
  company: 'Company',
  admin: 'Admin',
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

function AdminUsers({ onNavigate, currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [errors, setErrors] = useState([])
  const [userErrors, setUserErrors] = useState({})

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await authenticatedFetch('/api/admin/users/')
        const data = await response.json()
        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }
        setUsers(Array.isArray(data) ? data : [])
        setErrors([])
      } catch {
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const updateStatus = async (user) => {
    const nextActive = !user.is_active
    if (!nextActive && !window.confirm(`Deactivate ${user.username}?`)) {
      return
    }

    setUpdatingId(user.id)
    setUserErrors((current) => ({ ...current, [user.id]: '' }))
    try {
      const response = await authenticatedFetch(`/api/admin/users/${user.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      })
      const data = await response.json()
      if (!response.ok) {
        setUserErrors((current) => ({
          ...current,
          [user.id]: formatApiErrors(data).join(' '),
        }))
        return
      }
      setUsers((current) => current.map((item) => item.id === user.id ? data : item))
    } catch {
      setUserErrors((current) => ({
        ...current,
        [user.id]: 'Could not reach the server. Please try again.',
      }))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="home dashboard-page admin-users-page">
      <h1>Users</h1>
      <p>Manage UniConnect account access</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}

      {!loading && errors.length === 0 && users.length === 0 && (
        <p className="api-status">No users found.</p>
      )}

      {!loading && errors.length === 0 && users.length > 0 && (
        <section className="admin-list" aria-label="All users">
          {users.map((user) => {
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
            const isCurrentUser = currentUser?.id === user.id
            return (
              <article className="admin-list-card" key={user.id}>
                <div>
                  <h3>{user.username}</h3>
                  <p>{fullName || 'No name provided'}</p>
                </div>
                <dl>
                  <div><dt>Email</dt><dd>{displayValue(user.email)}</dd></div>
                  <div><dt>Role</dt><dd>{roleLabels[user.role] || user.role}</dd></div>
                  <div><dt>Status</dt><dd>{user.is_active ? 'Active' : 'Inactive'}</dd></div>
                  <div><dt>Date joined</dt><dd>{displayValue(user.date_joined)}</dd></div>
                </dl>
                <div className="admin-user-actions">
                  {isCurrentUser ? (
                    <span className="admin-user-note">Current account</span>
                  ) : (
                    <button
                      type="button"
                      className={user.is_active ? 'secondary-button' : 'apply-button'}
                      onClick={() => updateStatus(user)}
                      disabled={updatingId === user.id}
                    >
                      {updatingId === user.id
                        ? 'Updating...'
                        : user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
                {userErrors[user.id] && (
                  <p className="api-status error admin-user-error">{userErrors[user.id]}</p>
                )}
              </article>
            )
          })}
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

export default AdminUsers
