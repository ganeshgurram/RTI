import { Router } from "express"

import { notificationView } from "../lib/formatters.js"
import { requireAuth } from "../middleware/auth.js"

export const notificationsRouter = Router()

notificationsRouter.get("/", requireAuth, async (request, response, next) => {
  try {
    const records = await request.db.collection("notifications").find({ userId: request.user._id }).sort({ createdAt: -1 }).toArray()
    response.json({ notifications: records.map(notificationView) })
  } catch (error) {
    next(error)
  }
})

notificationsRouter.patch("/read-all", requireAuth, async (request, response, next) => {
  try {
    await request.db.collection("notifications").updateMany({ userId: request.user._id, isRead: false }, { $set: { isRead: true, readAt: new Date() } })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

notificationsRouter.patch("/:notificationId/read", requireAuth, async (request, response, next) => {
  try {
    await request.db.collection("notifications").updateOne({ notificationId: request.params.notificationId, userId: request.user._id }, { $set: { isRead: true, readAt: new Date() } })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})
