import { useEffect, useState } from 'react'
import AuthPage from './AuthPage.jsx'
import CompanyProfile from './CompanyProfile.jsx'
import CompanyDashboard from './CompanyDashboard.jsx'
import CreateOpportunity from './CreateOpportunity.jsx'
import ApplicationsReceived from './ApplicationsReceived.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import AdminUsers from './AdminUsers.jsx'
import AdminOpportunities from './AdminOpportunities.jsx'
import AdminCompanies from './AdminCompanies.jsx'
import AdminApplications from './AdminApplications.jsx'
import MyApplications from './MyApplications.jsx'
import MyOpportunities from './MyOpportunities.jsx'
import MyPortfolio from './MyPortfolio.jsx'
import Opportunities from './Opportunities.jsx'
import OpportunityDetails from './OpportunityDetails.jsx'
import StudentProfile from './StudentProfile.jsx'
import StudentDashboard from './StudentDashboard.jsx'
import CandidateProfile from './CandidateProfile.jsx'
import AuthenticatedShell from './AuthenticatedShell.jsx'
import './App.css'

const THEME_STORAGE_KEY = 'uniconnect-theme'

function getInitialTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getInitialPage() {
  return loadStoredUser() ? 'home' : 'login'
}

function App() {
  const [page, setPage] = useState(getInitialPage)
  const [theme, setTheme] = useState(getInitialTheme)
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [user, setUser] = useState(loadStoredUser)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null)
      setPage('login')
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
    setPage('login')
  }

  const handleThemeChange = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
      return nextTheme
    })
  }

  const handleNavigate = (nextPage, params = {}) => {
    if (nextPage === 'opportunity-details') {
      setSelectedOpportunityId(params.opportunityId)
    }
    if (nextPage === 'candidate-profile') {
      setSelectedStudentId(params.studentId)
    }
    setPage(nextPage)
  }

  if (page === 'register') {
    return (
      <AuthPage
        initialMode="register"
        onNavigate={setPage}
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
      />
    )
  }

  if (page === 'login') {
    return (
      <AuthPage
        initialMode="login"
        onNavigate={setPage}
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
      />
    )
  }

  let pageContent = null

  if (page === 'student-profile') {
    pageContent = <StudentProfile onNavigate={setPage} />
  } else if (page === 'student-dashboard' && user?.role === 'student') {
    pageContent = <StudentDashboard onNavigate={setPage} />
  } else if (page === 'admin-dashboard' && user?.role === 'admin') {
    pageContent = <AdminDashboard />
  } else if (page === 'admin-users' && user?.role === 'admin') {
    pageContent = <AdminUsers currentUser={user} />
  } else if (page === 'admin-opportunities' && user?.role === 'admin') {
    pageContent = <AdminOpportunities />
  } else if (page === 'admin-companies' && user?.role === 'admin') {
    pageContent = <AdminCompanies />
  } else if (page === 'admin-applications' && user?.role === 'admin') {
    pageContent = <AdminApplications />
  } else if (page === 'my-applications' && user?.role === 'student') {
    pageContent = <MyApplications onNavigate={setPage} />
  } else if (page === 'my-portfolio' && user?.role === 'student') {
    pageContent = <MyPortfolio onNavigate={setPage} />
  } else if (page === 'my-opportunities' && user?.role === 'company') {
    pageContent = <MyOpportunities onNavigate={setPage} />
  } else if (page === 'company-profile' && user?.role === 'company') {
    pageContent = <CompanyProfile onNavigate={setPage} />
  } else if (page === 'company-dashboard' && user?.role === 'company') {
    pageContent = <CompanyDashboard onNavigate={setPage} />
  } else if (page === 'applications-received' && user?.role === 'company') {
    pageContent = <ApplicationsReceived onNavigate={handleNavigate} />
  } else if (page === 'candidate-profile' && user?.role === 'company') {
    pageContent = (
      <CandidateProfile
        studentId={selectedStudentId}
        onNavigate={handleNavigate}
        user={user}
      />
    )
  } else if (page === 'create-opportunity' && user?.role === 'company') {
    pageContent = <CreateOpportunity onNavigate={setPage} />
  } else if (page === 'opportunities' && user) {
    pageContent = <Opportunities onNavigate={handleNavigate} user={user} />
  } else if (page === 'opportunity-details' && ['student', 'company'].includes(user?.role)) {
    pageContent = (
      <OpportunityDetails
        opportunityId={selectedOpportunityId}
        onNavigate={handleNavigate}
        user={user}
      />
    )
  }

  const homeContent = (
    <main className="home overview-page">
      <div className="overview-hero">
        <span className="overview-kicker">Authenticated workspace</span>
        <h1>Welcome back, {user?.username || 'there'}.</h1>
        <p>Move your next opportunity forward with a focused workspace for your career journey.</p>
      </div>

      {loading && <p className="api-status">Loading...</p>}
      {error && <p className="api-status error">{error}</p>}
      {!loading && !error && message && (
        <p className="api-status">{message}</p>
      )}

      {user ? (
        <>
          <p className="api-status user-context overview-context">
            Logged in as {user.username} ({user.role})
          </p>
          <nav className="overview-shortcuts" aria-label="Workspace shortcuts">
            <button type="button" onClick={() => setPage('opportunities')}>
              Explore opportunities
            </button>
            {user.role === 'student' && (
              <>
                <button type="button" onClick={() => setPage('student-dashboard')}>
                  Open dashboard
                </button>
                <button type="button" onClick={() => setPage('student-profile')}>
                  Complete profile
                </button>
              </>
            )}
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

  if (user) {
    return (
      <AuthenticatedShell
        page={page}
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        theme={theme}
        onThemeChange={handleThemeChange}
      >
        {pageContent || homeContent}
      </AuthenticatedShell>
    )
  }

  return homeContent
}

export default App
