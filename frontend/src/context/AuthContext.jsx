import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => readStoredUser())
  const [status, setStatus] = useState(
    () => (localStorage.getItem(TOKEN_KEY) ? 'loading' : 'unauthenticated'),
  )

  // Validate stored token against the API on boot
  useEffect(() => {
    let cancelled = false
    if (!token) {
      setStatus('unauthenticated')
      return
    }
    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled) return
        setUser(res.data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user))
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        // Token expired/invalid → clear session
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
        setStatus('unauthenticated')
      })
    return () => {
      cancelled = true
    }
  }, []) // run once on mount

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    setStatus('authenticated')
    return newUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // token may already be invalid — still clear locally
    }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(() => ({ token, user, status, login, logout }), [token, user, status, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
