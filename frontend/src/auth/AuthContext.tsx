import { createContext, useContext, useMemo, useState } from "react"

import { demoCredentials, digiLockerMockProfile, mockProfile } from "@/data/mock-profile"

type AuthUser = Pick<typeof mockProfile, "id" | "username" | "initials" | "fullName" | "email"> & {
  profile: typeof mockProfile
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => string | null
  loginWithDigiLocker: () => void
  logout: () => void
}

const storageKey = "rti-demo-session"
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function createAuthUser(profile: typeof mockProfile): AuthUser {
  return {
    id: profile.id,
    username: profile.username,
    initials: profile.initials,
    fullName: profile.fullName,
    email: profile.email,
    profile,
  }
}

const demoUser = createAuthUser(mockProfile)
const digiLockerUser = createAuthUser(digiLockerMockProfile)

function getStoredUser() {
  try {
    const signInMethod = localStorage.getItem(storageKey)
    if (signInMethod === "digilocker") return digiLockerUser
    return signInMethod ? demoUser : null
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
      localStorage.setItem(storageKey, "password")
      return null
    },
    loginWithDigiLocker: () => {
      setUser(digiLockerUser)
      localStorage.setItem(storageKey, "digilocker")
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
