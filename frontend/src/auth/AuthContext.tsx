import { createContext, useContext, useMemo, useState } from "react"

import { demoCredentials, mockProfile } from "@/data/mock-profile"

type AuthUser = Pick<typeof mockProfile, "id" | "username" | "initials" | "fullName" | "email">

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => string | null
  logout: () => void
}

const storageKey = "rti-demo-session"
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const demoUser: AuthUser = {
  id: mockProfile.id,
  username: mockProfile.username,
  initials: mockProfile.initials,
  fullName: mockProfile.fullName,
  email: mockProfile.email,
}

function getStoredUser() {
  try {
    return localStorage.getItem(storageKey) ? demoUser : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    login: (username, password) => {
      if (username.trim().toLowerCase() !== demoCredentials.username || password !== demoCredentials.password) {
        return "Use the demo credentials shown below to sign in."
      }

      setUser(demoUser)
      localStorage.setItem(storageKey, "active")
      return null
    },
    logout: () => {
      setUser(null)
      localStorage.removeItem(storageKey)
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
