import { useState } from 'react'

function Register({ onNavigate, onSwitch }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState([])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setSuccess('')
    setErrors([])

    try {
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        const messages = []
        for (const [field, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            value.forEach((msg) => messages.push(`${field}: ${msg}`))
          } else if (typeof value === 'string') {
            messages.push(value)
          }
        }
        setErrors(messages.length ? messages : ['Registration failed.'])
        return
      }

      setSuccess(`Account created for ${data.username}.`)
      setUsername('')
      setEmail('')
      setPassword('')
      setRole('student')
    } catch {
      setErrors(['Could not reach the server. Please try again.'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form-content">
      <div className="auth-form-heading">
        <span className="auth-eyebrow">Create your account</span>
        <h2>Join UniConnect</h2>
        <p>Build your profile and find your next opportunity.</p>
      </div>

      <form className="auth-form register-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>

        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="company">Company</option>
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
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

      <nav className="page-nav auth-form-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>
          Home
        </button>
        <button type="button" className="link-button auth-switch-button" onClick={() => onSwitch('login')}>
          Already a member? <strong>Sign in</strong>
        </button>
      </nav>
    </div>
  )
}

export default Register
