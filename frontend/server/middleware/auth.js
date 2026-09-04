import { getCookie, sessionCookieName } from "../services/sessions.js"

export async function requireAuth(request, response, next) {
  try {
    const token = getCookie(request, sessionCookieName)
    if (!token) return response.status(401).json({ error: "authenticationRequired" })

    const session = await request.db.collection("sessions").findOne({ token, expiresAt: { $gt: new Date() } })
    if (!session) return response.status(401).json({ error: "sessionExpired" })

    const user = await request.db.collection("users").findOne({ _id: session.userId })
    if (!user) return response.status(401).json({ error: "sessionExpired" })

    request.user = user
    request.session = session
    next()
  } catch (error) {
    next(error)
  }
}
