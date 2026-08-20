import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../lib/api/auth'
import { setAuthToken } from '../lib/http'
import type { User } from '../types'

const TOKEN_STORAGE_KEY = 'forgeforce_qc_token'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!stored) {
      setIsLoading(false)
      return
    }

    setAuthToken(stored)
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setAuthToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await authApi.login(email, password)
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    setAuthToken(token)
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {
      // Already unauthenticated or token expired server-side — clear locally regardless.
    })
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setAuthToken(null)
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
