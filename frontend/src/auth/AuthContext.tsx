import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { type ApplicantProfile } from "@/data/mock-profile"
import { ApiError, api, clearLegacyApiToken } from "@/services/api"

type AuthUser = Pick<ApplicantProfile, "id" | "username" | "initials" | "fullName" | "email"> & { profile: ApplicantProfile }

export type SignupDetails = {
  fullName: string
  email: string
  mobile: string
  username: string
  password: string
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<string | null>
  loginWithDigiLocker: () => Promise<string | null>
  signup: (details: SignupDetails) => Promise<string | null>
  updateProfile: (profile: ApplicantProfile) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function createAuthUser(profile: ApplicantProfile): AuthUser {
  return { id: profile.id, username: profile.username, initials: profile.initials, fullName: profile.fullName, email: profile.email, profile }
}

function errorKey(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.code : fallback
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    clearLegacyApiToken()

    void api.me()
      .then(({ profile }) => setUser(createAuthUser(profile as ApplicantProfile)))
      .catch(() => undefined)
      .finally(() => setIsLoading(false))
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    login: async (username, password) => {
      try {
        const result = await api.login(username, password)
        setUser(createAuthUser(result.profile as ApplicantProfile))
        return null
      } catch (error) {
        return errorKey(error, "invalidCredentials") === "invalidCredentials" ? "login.invalidCredentials" : "login.unavailable"
      }
    },
    loginWithDigiLocker: async () => {
      try {
        const result = await api.digiLockerLogin()
        setUser(createAuthUser(result.profile as ApplicantProfile))
        return null
      } catch {
        return "login.unavailable"
      }
    },
    signup: async (details) => {
      try {
        const result = await api.signup(details)
        setUser(createAuthUser(result.profile as ApplicantProfile))
        return null
      } catch (error) {
        const code = errorKey(error, "signupUnavailable")
        if (code === "usernameTaken") return "signup.usernameTaken"
        if (code === "emailTaken") return "signup.emailTaken"
        return "signup.unavailable"
      }
    },
    updateProfile: async (profile) => {
      try {
        const result = await api.updateProfile(profile)
        setUser(createAuthUser(result.profile as ApplicantProfile))
        return null
      } catch (error) {
        return errorKey(error, "profileUnavailable")
      }
    },
    logout: () => {
      void api.logout().catch(() => undefined)
      clearLegacyApiToken()
      setUser(null)
    },
  }), [isLoading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
