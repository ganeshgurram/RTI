import crypto from "node:crypto"

export const sessionCookieName = "rti_session"
const isProduction = process.env.NODE_ENV === "production"

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const clearSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
}

export async function issueSession(db, userId) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-", "")}`
  await db.collection("sessions").insertOne({ token, userId, createdAt: new Date(), expiresAt: new Date(Date.now() + sessionCookieOptions.maxAge) })
  return token
}

export function getCookie(request, name) {
  const prefix = `${name}=`
  const cookie = request.get("cookie")?.split(";").map((value) => value.trim()).find((value) => value.startsWith(prefix))
  if (!cookie) return undefined
  try {
    return decodeURIComponent(cookie.slice(prefix.length))
  } catch {
    return undefined
  }
}
