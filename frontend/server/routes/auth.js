import bcrypt from "bcryptjs"
import { Router } from "express"

import { cleanEmail, dateLabel, dateTimeLabel, normaliseMobile, publicProfile } from "../lib/formatters.js"
import { requireAuth } from "../middleware/auth.js"
import { clearSessionCookieOptions, getCookie, issueSession, sessionCookieName, sessionCookieOptions } from "../services/sessions.js"

export const authRouter = Router()

authRouter.post("/login", async (request, response, next) => {
  try {
    const username = String(request.body?.username ?? "").trim().toLowerCase()
    const password = String(request.body?.password ?? "")
    const user = await request.db.collection("users").findOne({ username })

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return response.status(401).json({ error: "invalidCredentials" })
    }

    const lastLogin = dateTimeLabel(new Date())
    await request.db.collection("users").updateOne({ _id: user._id }, { $set: { "profile.account.lastLogin": lastLogin, updatedAt: new Date() } })
    user.profile.account.lastLogin = lastLogin
    const token = await issueSession(request.db, user._id)
    response.cookie(sessionCookieName, token, sessionCookieOptions).json({ profile: publicProfile(user.profile) })
  } catch (error) {
    next(error)
  }
})

authRouter.get("/digilocker/preview", async (request, response, next) => {
  try {
    const user = await request.db.collection("users").findOne({ username: "ananya.nair" })
    if (!user) return response.status(500).json({ error: "demoUserUnavailable" })
    response.json({ profile: publicProfile(user.profile) })
  } catch (error) {
    next(error)
  }
})

authRouter.post("/digilocker", async (request, response, next) => {
  try {
    const user = await request.db.collection("users").findOne({ username: "ananya.nair" })
    if (!user) return response.status(500).json({ error: "demoUserUnavailable" })

    const token = await issueSession(request.db, user._id)
    response.cookie(sessionCookieName, token, sessionCookieOptions).json({ profile: publicProfile(user.profile) })
  } catch (error) {
    next(error)
  }
})

authRouter.post("/signup", async (request, response, next) => {
  try {
    const { fullName, email, mobile, username, password } = request.body ?? {}
    const normalisedUsername = String(username ?? "").trim().toLowerCase()
    const normalisedEmail = cleanEmail(email)

    if (String(fullName ?? "").trim().length < 2 || !/^\S+@\S+\.\S+$/.test(normalisedEmail) || !/^\d{10}$/.test(normaliseMobile(mobile)) || !/^[a-z0-9][a-z0-9._]{3,19}$/.test(normalisedUsername) || String(password ?? "").length < 8) {
      return response.status(400).json({ error: "invalidSignup" })
    }

    const duplicate = await request.db.collection("users").findOne({ $or: [{ username: normalisedUsername }, { "profile.email": normalisedEmail }] })
    if (duplicate) return response.status(409).json({ error: duplicate.username === normalisedUsername ? "usernameTaken" : "emailTaken" })

    const now = new Date()
    const fullNameValue = String(fullName).trim()
    const words = fullNameValue.split(/\s+/)
    const profile = {
      id: `CIT-${now.getUTCFullYear()}-${String(Date.now()).slice(-6)}`,
      username: normalisedUsername,
      initials: `${words[0]?.[0] ?? ""}${words.length > 1 ? words.at(-1)?.[0] ?? "" : ""}`.toUpperCase(),
      fullName: fullNameValue,
      guardianName: "", dateOfBirth: "", gender: "", citizenship: "Indian", email: normalisedEmail,
      mobile: `+91 ${normaliseMobile(mobile)}`, alternateMobile: "", country: "India", countryName: "", areaType: "", educationalStatus: "", addressText: "", preferredLanguage: "English",
      address: { line1: "", line2: "", city: "", district: "", state: "", pincode: "" },
      account: { status: "Verified", memberSince: dateLabel(now), lastLogin: dateTimeLabel(now), loginMethod: "Username and password" },
    }
    const result = await request.db.collection("users").insertOne({ username: normalisedUsername, passwordHash: await bcrypt.hash(String(password), 12), profile, createdAt: now, updatedAt: now })
    const token = await issueSession(request.db, result.insertedId)
    response.status(201).cookie(sessionCookieName, token, sessionCookieOptions).json({ profile })
  } catch (error) {
    next(error)
  }
})

authRouter.post("/logout", async (request, response, next) => {
  try {
    const token = getCookie(request, sessionCookieName)
    if (token) await request.db.collection("sessions").deleteOne({ token })
    response.clearCookie(sessionCookieName, clearSessionCookieOptions).status(204).end()
  } catch (error) {
    next(error)
  }
})

authRouter.get("/me", requireAuth, (request, response) => response.json({ profile: publicProfile(request.user.profile) }))
