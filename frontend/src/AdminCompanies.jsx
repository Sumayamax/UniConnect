import { useEffect, useState } from 'react'
import { authenticatedFetch } from './api.js'

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

function AdminCompanies({ onNavigate }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [errors, setErrors] = useState([])
  const [companyErrors, setCompanyErrors] = useState({})

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await authenticatedFetch('/api/admin/companies/')
        const data = await response.json()
        if (!response.ok) {
          setErrors(formatApiErrors(data))
          return
        }
        setCompanies(Array.isArray(data) ? data : [])
        setErrors([])
      } catch {
        setErrors(['Could not reach the server. Please try again.'])
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [])

  const updateCompany = async (company, field, nextValue) => {
    if (field === 'is_active' && nextValue === false) {
      if (!window.confirm(`Deactivate ${company.company_name || company.username}?`)) {
        return
      }
    }

    setUpdatingId(company.id)
    setCompanyErrors((current) => ({ ...current, [company.id]: '' }))
    try {
      const response = await authenticatedFetch(`/api/admin/companies/${company.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: nextValue }),
      })
      const data = await response.json()
      if (!response.ok) {
        setCompanyErrors((current) => ({
          ...current,
          [company.id]: formatApiErrors(data).join(' '),
        }))
        return
      }
      setCompanies((current) =>
        current.map((item) => item.id === company.id ? data : item),
      )
    } catch {
      setCompanyErrors((current) => ({
        ...current,
        [company.id]: 'Could not reach the server. Please try again.',
      }))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="home dashboard-page admin-users-page">
      <h1>Companies</h1>
      <p>Manage company verification and account access</p>

      {loading && <p className="api-status">Loading...</p>}

      {!loading && errors.length > 0 && (
        <ul className="error-list">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}

      {!loading && errors.length === 0 && companies.length === 0 && (
        <p className="api-status">No companies found.</p>
      )}

      {!loading && errors.length === 0 && companies.length > 0 && (
        <section className="admin-list" aria-label="All companies">
          {companies.map((company) => (
            <article className="admin-list-card" key={company.id}>
              <div>
                <h3>{displayValue(company.company_name)}</h3>
                <p>{displayValue(company.username)}</p>
                <div className="company-badges">
                  <span className={company.is_verified ? 'badge verified' : 'badge unverified'}>
                    {company.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                  <span className={company.is_active ? 'badge active' : 'badge inactive'}>
                    {company.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <dl>
                <div><dt>Email</dt><dd>{displayValue(company.email)}</dd></div>
                <div><dt>Industry</dt><dd>{displayValue(company.industry)}</dd></div>
                <div><dt>Location</dt><dd>{displayValue(company.location)}</dd></div>
                <div><dt>Website</dt><dd>{company.website ? <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a> : 'Not specified'}</dd></div>
                <div><dt>Contact email</dt><dd>{displayValue(company.contact_email)}</dd></div>
                <div><dt>Date joined</dt><dd>{displayValue(company.date_joined)}</dd></div>
              </dl>
              <div className="admin-user-actions">
                <button
                  type="button"
                  className={company.is_verified ? 'secondary-button' : 'apply-button'}
                  onClick={() => updateCompany(company, 'is_verified', !company.is_verified)}
                  disabled={updatingId === company.id}
                >
                  {updatingId === company.id ? 'Updating...' : company.is_verified ? 'Unverify' : 'Verify'}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => updateCompany(company, 'is_active', !company.is_active)}
                  disabled={updatingId === company.id}
                >
                  {updatingId === company.id ? 'Updating...' : company.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
              {companyErrors[company.id] && (
                <p className="api-status error admin-user-error">{companyErrors[company.id]}</p>
              )}
            </article>
          ))}
        </section>
      )}

      <nav className="page-nav dashboard-nav">
        <button type="button" className="link-button" onClick={() => onNavigate('admin-dashboard')}>Dashboard</button>
        <button type="button" className="link-button" onClick={() => onNavigate('home')}>Home</button>
      </nav>
    </main>
  )
}

export default AdminCompanies
