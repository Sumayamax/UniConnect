import { useState } from 'react'
import Login from './Login.jsx'
import Register from './Register.jsx'

function AuthPage({ initialMode, onNavigate, onLoginSuccess, theme }) {
  const [mode, setMode] = useState(initialMode)
  const isRegister = mode === 'register'

  const switchMode = (nextMode) => {
    setMode(nextMode)
  }

  return (
    <main className={`auth-page theme-${theme} ${isRegister ? 'is-register' : 'is-login'}`}>
      <div className="auth-background-glow" aria-hidden="true" />
      <section className="auth-card" aria-label="UniConnect authentication">
        <div className="auth-brand">
          <div className="auth-logo" aria-hidden="true">UC</div>
          <span>UniConnect</span>
        </div>

        <div className="auth-forms">
          <div className={`auth-form-view login-view ${!isRegister ? 'is-active' : ''}`}>
            <Login
              onNavigate={onNavigate}
              onSwitch={switchMode}
              onLoginSuccess={onLoginSuccess}
            />
          </div>
          <div className={`auth-form-view register-view ${isRegister ? 'is-active' : ''}`}>
            <Register onNavigate={onNavigate} onSwitch={switchMode} />
          </div>
        </div>

        <aside className="auth-promo" aria-live="polite">
          <div className="auth-promo-content">
            <span className="auth-eyebrow">
              {isRegister ? 'Start your journey' : 'Welcome back'}
            </span>
            <h1>{isRegister ? 'Build what comes next.' : 'Your next opportunity awaits.'}</h1>
            <p>
              {isRegister
                ? 'Join a focused network built for ambitious students and forward-thinking companies.'
                : 'Connect with meaningful work, talented people, and the momentum to move forward.'}
            </p>
            <button
              type="button"
              className="auth-promo-button"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
            >
              {isRegister ? 'Sign in instead' : 'Create an account'}
            </button>
          </div>
          <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
          <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
        </aside>
      </section>
    </main>
  )
}

export default AuthPage
