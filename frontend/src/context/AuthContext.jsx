import { createContext, useContext, useState, useCallback } from 'react'
import { login as apiLogin, register as apiRegister } from '../services/api'

const AuthContext = createContext(null)

// Role constants — single source of truth for the frontend
export const ROLES = { HR: 'hr', MANAGER: 'manager', EMPLOYEE: 'employee' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user'))
      if (stored) return stored
    } catch { /* ignore */ }
    return null
  })

  const _persist = useCallback((token, user) => {
    if (!token) throw new Error('No token in server response')
    // user object may be absent on some server versions — build a minimal one from the JWT payload
    const resolved = user ?? (() => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        return { id: payload.sub, email: payload.email, role: payload.role }
      } catch { return null }
    })()
    if (!resolved) throw new Error('Could not resolve user from server response')
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(resolved))
    setUser(resolved)
    return resolved
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data } = await apiLogin({ email, password })
    return _persist(data?.token, data?.user)
  }, [_persist])

  const signUp = useCallback(async (email, password, role) => {
    const { data } = await apiRegister({ email, password, role })
    return _persist(data?.token, data?.user)
  }, [_persist])

  const signOut = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  // true if the current user has one of the supplied roles
  const hasRole = useCallback((...roles) => roles.includes(user?.role), [user])

  // hr + manager may create / update records
  const canWrite = useCallback(
    () => [ROLES.HR, ROLES.MANAGER].includes(user?.role),
    [user]
  )

  // only hr may delete records
  const canDelete = useCallback(() => user?.role === ROLES.HR, [user])

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, hasRole, canWrite, canDelete }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
