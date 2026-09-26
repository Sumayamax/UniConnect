import { useState } from 'react'

function Login({ onNavigate, onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (typeof data.detail === 'string') {
          setError(data.detail)
        } else {
          const messages = []
          for (const [field, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
              value.forEach((msg) => messages.push(`${field}: ${msg}`))
            } else if (typeof value === 'string') {
              messages.push(value)
            }
          }
          setError(messages.length ? messages.join(' ') : 'Login failed.')
        }
        return
      }

      onLoginSuccess({
        access: data.access,
        refresh: data.refresh,
        user: data.user,
      })
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="home">
      <h1>Login</h1>
      <p>Sign in to UniConnect</p>

      <form className="register-form" onSubmit={handleSubmit}>
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
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      {error && <p className="api-status error">{error}</p>}

      <nav className="page-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>
          Home
        </button>
        <button type="button" className="link-button" onClick={() => onNavigate('register')}>
          Register
        </button>
      </nav>
    </main>
  )
}

export default Login
