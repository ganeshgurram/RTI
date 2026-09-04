import cors from "cors"
import express from "express"

import { prepareDatabase } from "./db.js"
import { errorHandler, notFound } from "./middleware/errors.js"
import { authRouter } from "./routes/auth.js"
import { healthRouter } from "./routes/health.js"
import { notificationsRouter } from "./routes/notifications.js"
import { paymentsRouter } from "./routes/payments.js"
import { profileRouter } from "./routes/profile.js"
import { publicRequestsRouter, requestsRouter } from "./routes/requests.js"

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true }))
app.use(express.json({ limit: "1mb" }))

// Vercel reuses a runtime instance when possible. prepareDatabase caches connection, indexes and
// demo seeding per instance while still recovering cleanly from a failed first connection.
app.use(async (request, _response, next) => {
  try {
    request.db = await prepareDatabase()
    next()
  } catch (error) {
    next(error)
  }
})

app.use("/api/health", healthRouter)
app.use("/api/auth", authRouter)
app.use("/api/profile", profileRouter)
app.use("/api/requests", requestsRouter)
app.use("/api/public/requests", publicRequestsRouter)
app.use("/api/payments", paymentsRouter)
app.use("/api/notifications", notificationsRouter)

app.use(notFound)
app.use(errorHandler)

export default app
