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

  const signIn = useCallback(async (email, password) => {
    const { data } = await apiLogin({ email, password })
    const token = data?.token
    const user  = data?.user
    if (!token || !user) throw new Error('Invalid response from server')
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }, [])

  const signUp = useCallback(async (email, password, role) => {
    const { data } = await apiRegister({ email, password, role })
    const token = data?.token
    const user  = data?.user
    if (!token || !user) throw new Error('Invalid response from server')
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }, [])

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
