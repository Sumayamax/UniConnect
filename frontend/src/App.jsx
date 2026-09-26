import { useEffect, useState } from 'react'
import Login from './Login.jsx'
import Register from './Register.jsx'
import CompanyProfile from './CompanyProfile.jsx'
import CompanyDashboard from './CompanyDashboard.jsx'
import CreateOpportunity from './CreateOpportunity.jsx'
import ApplicationsReceived from './ApplicationsReceived.jsx'
import MyApplications from './MyApplications.jsx'
import MyOpportunities from './MyOpportunities.jsx'
import MyPortfolio from './MyPortfolio.jsx'
import Opportunities from './Opportunities.jsx'
import StudentProfile from './StudentProfile.jsx'
import StudentDashboard from './StudentDashboard.jsx'
import './App.css'

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function App() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(loadStoredUser)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null)
      setPage('home')
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => window.removeEventListener('auth-expired', handleAuthExpired)
  }, [])

  useEffect(() => {
    if (page !== 'home') {
      return
    }

    setLoading(true)
    fetch('http://127.0.0.1:8000/api/')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch API message')
        }
        return response.json()
      })
      .then((data) => {
        setMessage(data.message)
        setError('')
      })
      .catch(() => {
        setError('Could not load message from the API')
        setMessage('')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [page])

  const handleLoginSuccess = (authData) => {
    localStorage.setItem('access', authData.access)
    localStorage.setItem('refresh', authData.refresh)
    localStorage.setItem('user', JSON.stringify(authData.user))
    setUser(authData.user)
    setPage('home')
  }

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    setUser(null)
    setPage('home')
  }

  if (page === 'register') {
    return <Register onNavigate={setPage} />
  }

  if (page === 'login') {
    return <Login onNavigate={setPage} onLoginSuccess={handleLoginSuccess} />
  }

  if (page === 'student-profile') {
    return <StudentProfile onNavigate={setPage} />
  }

  if (page === 'student-dashboard' && user?.role === 'student') {
    return <StudentDashboard onNavigate={setPage} />
  }

  if (page === 'my-applications' && user?.role === 'student') {
    return <MyApplications onNavigate={setPage} />
  }

  if (page === 'my-portfolio' && user?.role === 'student') {
    return <MyPortfolio onNavigate={setPage} />
  }

  if (page === 'my-opportunities' && user?.role === 'company') {
    return <MyOpportunities onNavigate={setPage} />
  }

  if (page === 'company-profile' && user?.role === 'company') {
    return <CompanyProfile onNavigate={setPage} />
  }

  if (page === 'company-dashboard' && user?.role === 'company') {
    return <CompanyDashboard onNavigate={setPage} />
  }

  if (page === 'applications-received' && user?.role === 'company') {
    return <ApplicationsReceived onNavigate={setPage} />
  }

  if (page === 'create-opportunity' && user?.role === 'company') {
    return <CreateOpportunity onNavigate={setPage} />
  }

  if (page === 'opportunities' && user) {
    return <Opportunities onNavigate={setPage} user={user} />
  }

  return (
    <main className="home">
      <h1>UniConnect</h1>
      <p>Find internships and freelance opportunities</p>

      {loading && <p className="api-status">Loading...</p>}
      {error && <p className="api-status error">{error}</p>}
      {!loading && !error && message && (
        <p className="api-status">{message}</p>
      )}

      {user ? (
        <>
          <p className="api-status">
            Logged in as {user.username} ({user.role})
          </p>
          <nav className="page-nav">
            <button
              type="button"
              className="link-button"
              onClick={() => setPage('opportunities')}
            >
              Opportunities
            </button>
            {user.role === 'student' && (
              <>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('student-dashboard')}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('student-profile')}
                >
                  My Profile
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('my-applications')}
                >
                  My Applications
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('my-portfolio')}
                >
                  My Portfolio
                </button>
              </>
            )}
            {user.role === 'company' && (
              <>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('company-dashboard')}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('company-profile')}
                >
                  Company Profile
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('create-opportunity')}
                >
                  Create Opportunity
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('applications-received')}
                >
                  Applications Received
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPage('my-opportunities')}
                >
                  My Opportunities
                </button>
              </>
            )}
            <button type="button" className="link-button" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </>
      ) : (
        <nav className="page-nav">
          <button
            type="button"
            className="link-button"
            onClick={() => setPage('register')}
          >
            Register
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => setPage('login')}
          >
            Login
          </button>
        </nav>
      )}
    </main>
  )
}

export default App
