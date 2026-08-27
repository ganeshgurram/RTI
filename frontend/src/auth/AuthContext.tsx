import { createContext, useContext, useMemo, useState } from "react"

import { demoCredentials, digiLockerMockProfile, mockProfile, type ApplicantProfile } from "@/data/mock-profile"

type AuthUser = Pick<ApplicantProfile, "id" | "username" | "initials" | "fullName" | "email"> & {
  profile: ApplicantProfile
}

export type SignupDetails = {
  fullName: string
  email: string
  mobile: string
  username: string
  password: string
}

/** The one account a visitor can register in this prototype. */
type RegisteredAccount = {
  password: string
  profile: ApplicantProfile
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => string | null
  loginWithDigiLocker: () => void
  signup: (details: SignupDetails) => string | null
  logout: () => void
}

const storageKey = "rti-demo-session"
const accountStorageKey = "rti-demo-account"
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable in private windows; the session still works for this tab.
  }
}

function clearStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // See writeStorage.
  }
}

function createAuthUser(profile: ApplicantProfile): AuthUser {
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

/** Kept apart from the session marker so a reload can rebuild the registered user rather than fall back to the demo one. */
function getStoredAccount(): RegisteredAccount | null {
  try {
    const stored = localStorage.getItem(accountStorageKey)
    if (!stored) return null

    const parsed = JSON.parse(stored) as RegisteredAccount
    if (typeof parsed?.password !== "string" || typeof parsed?.profile?.username !== "string") return null

    return parsed
  } catch {
    return null
  }
}

function getStoredUser() {
  try {
    const signInMethod = localStorage.getItem(storageKey)
    if (signInMethod === "digilocker") return digiLockerUser

    if (signInMethod === "registered") {
      const account = getStoredAccount()
      return account ? createAuthUser(account.profile) : null
    }

    return signInMethod ? demoUser : null
  } catch {
    return null
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })

/** "Rajesh Kumar" becomes "RK"; a single name contributes one letter. */
function getInitials(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return "?"

  const lastWord = words.length > 1 ? words[words.length - 1] : ""
  return `${words[0][0]}${lastWord[0] ?? ""}`.toUpperCase()
}

function formatMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, "").slice(-10)
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
}

/** Registration only asks for the essentials; the rest stays blank until the applicant fills it in from Profile. */
function createRegisteredProfile(details: SignupDetails): ApplicantProfile {
  const now = new Date()

  return {
    id: `CIT-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
    username: details.username,
    initials: getInitials(details.fullName),
    fullName: details.fullName,
    guardianName: "",
    dateOfBirth: "",
    gender: "",
    citizenship: "Indian",
    email: details.email,
    mobile: formatMobile(details.mobile),
    alternateMobile: "",
    country: "India",
    countryName: "",
    areaType: "",
    educationalStatus: "",
    addressText: "",
    preferredLanguage: "English",
    address: { line1: "", line2: "", city: "", district: "", state: "", pincode: "" },
    account: {
      status: "Verified",
      memberSince: dateFormatter.format(now),
      lastLogin: `${dateFormatter.format(now)}, ${timeFormatter.format(now)}`,
      loginMethod: "Username and password",
    },
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    login: (username, password) => {
      const enteredUsername = username.trim().toLowerCase()
      const account = getStoredAccount()

      if (account && enteredUsername === account.profile.username && password === account.password) {
        setUser(createAuthUser(account.profile))
        writeStorage(storageKey, "registered")
        return null
      }

      if (enteredUsername !== demoCredentials.username || password !== demoCredentials.password) {
        return "login.invalidCredentials"
      }

      setUser(demoUser)
      writeStorage(storageKey, "password")
      return null
    },
    loginWithDigiLocker: () => {
      setUser(digiLockerUser)
      writeStorage(storageKey, "digilocker")
    },
    signup: (details) => {
      const username = details.username.trim().toLowerCase()
      const email = details.email.trim().toLowerCase()
      const account = getStoredAccount()

      if ([demoCredentials.username, digiLockerMockProfile.username, account?.profile.username].includes(username)) {
        return "signup.usernameTaken"
      }

      if ([mockProfile.email, digiLockerMockProfile.email, account?.profile.email].includes(email)) {
        return "signup.emailTaken"
      }

      const profile = createRegisteredProfile({ ...details, fullName: details.fullName.trim(), username, email })

      writeStorage(accountStorageKey, JSON.stringify({ password: details.password, profile }))
      writeStorage(storageKey, "registered")
      setUser(createAuthUser(profile))
      return null
    },
    logout: () => {
      setUser(null)
      clearStorage(storageKey)
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
