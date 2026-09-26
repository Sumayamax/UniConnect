const API_BASE_URL = 'http://127.0.0.1:8000'

function clearAuthentication() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event('auth-expired'))
}

async function refreshAccessToken(refresh) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.access) {
      return null
    }

    localStorage.setItem('access', data.access)
    return data.access
  } catch {
    return null
  }
}

export async function authenticatedFetch(path, options = {}) {
  const access = localStorage.getItem('access')
  const headers = new Headers(options.headers || {})

  if (access) {
    headers.set('Authorization', `Bearer ${access}`)
  }

  const requestOptions = {
    ...options,
    headers,
  }
  let response = await fetch(`${API_BASE_URL}${path}`, requestOptions)

  if (response.status !== 401) {
    return response
  }

  const refresh = localStorage.getItem('refresh')
  if (!refresh) {
    clearAuthentication()
    return response
  }

  const newAccess = await refreshAccessToken(refresh)
  if (!newAccess) {
    clearAuthentication()
    return response
  }

  headers.set('Authorization', `Bearer ${newAccess}`)
  response = await fetch(`${API_BASE_URL}${path}`, requestOptions)

  if (response.status === 401) {
    clearAuthentication()
  }

  return response
}
