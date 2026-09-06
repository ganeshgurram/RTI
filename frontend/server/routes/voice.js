import { Router } from "express"

import { requireAuth } from "../middleware/auth.js"

export const voiceRouter = Router()

const GEMINI_TOKEN_ENDPOINT = "https://generativelanguage.googleapis.com/v1alpha/auth_tokens"

function requestSummary(record) {
  return {
    requestId: record.requestId,
    status: record.status,
    authority: record.authority,
    ministry: record.ministry,
    subject: record.subject,
    nextAction: record.nextAction,
    createdAt: record.createdAt,
  }
}

function expiry(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString()
}

// The long-lived Gemini key remains on the server. The browser receives a
// one-use token which can only create a session for a short time.
voiceRouter.post("/token", async (_request, response) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) return response.status(503).json({ error: "voiceUnavailable" })

  try {
    const tokenResponse = await fetch(GEMINI_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        uses: 1,
        expireTime: expiry(30),
        newSessionExpireTime: expiry(1),
      }),
    })
    const payload = await tokenResponse.json().catch(() => null)

    if (!tokenResponse.ok || typeof payload?.name !== "string") {
      console.error("Unable to create a Gemini Live token", { status: tokenResponse.status })
      return response.status(502).json({ error: "voiceUnavailable" })
    }

    return response.json({
      token: payload.name,
      expiresAt: payload.expireTime ?? expiry(30),
      model: process.env.GEMINI_LIVE_MODEL?.trim() || "gemini-2.5-flash-native-audio-latest",
    })
  } catch (error) {
    console.error("Unable to reach Gemini Live", error)
    return response.status(502).json({ error: "voiceUnavailable" })
  }
})

voiceRouter.post("/actions", requireAuth, async (request, response, next) => {
  try {
    const action = String(request.body?.action ?? "")
    const requests = request.db.collection("requests")
    const userId = request.user._id

    if (action === "get_my_request_summary") {
      const records = await requests
        .find(
          { userId },
          { projection: { requestId: 1, status: 1, authority: 1, ministry: 1, subject: 1, nextAction: 1, createdAt: 1 } },
        )
        .sort({ updatedAt: -1 })
        .limit(5)
        .toArray()
      return response.json({ requests: records.map(requestSummary) })
    }

    if (action === "get_my_request_status") {
      const requestId = String(request.body?.args?.requestId ?? "").trim().toUpperCase().slice(0, 80)
      if (!requestId) return response.status(400).json({ error: "requestIdRequired" })

      const record = await requests.findOne(
        { userId, requestId },
        { projection: { requestId: 1, status: 1, authority: 1, ministry: 1, subject: 1, nextAction: 1, createdAt: 1 } },
      )
      return response.json({ request: record ? requestSummary(record) : null })
    }

    return response.status(400).json({ error: "voiceActionUnavailable" })
  } catch (error) {
    next(error)
  }
})
