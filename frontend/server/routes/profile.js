import { Router } from "express"

import { cleanEmail, publicProfile } from "../lib/formatters.js"
import { requireAuth } from "../middleware/auth.js"

export const profileRouter = Router()

profileRouter.put("/", requireAuth, async (request, response, next) => {
  try {
    const profile = request.body?.profile
    if (!profile || typeof profile !== "object" || String(profile.fullName ?? "").trim().length < 2 || !/^\S+@\S+\.\S+$/.test(cleanEmail(profile.email))) {
      return response.status(400).json({ error: "invalidProfile" })
    }

    const nextProfile = { ...request.user.profile, ...profile, email: cleanEmail(profile.email), fullName: String(profile.fullName).trim() }
    const duplicate = await request.db.collection("users").findOne({ "profile.email": nextProfile.email, _id: { $ne: request.user._id } })
    if (duplicate) return response.status(409).json({ error: "emailTaken" })

    await request.db.collection("users").updateOne({ _id: request.user._id }, { $set: { profile: nextProfile, updatedAt: new Date() } })
    response.json({ profile: publicProfile(nextProfile) })
  } catch (error) {
    next(error)
  }
})
