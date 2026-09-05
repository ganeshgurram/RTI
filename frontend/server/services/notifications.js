import crypto from "node:crypto"

export async function addNotification(db, { userId, icon, title, description, requestId, action = "viewRequest" }) {
  await db.collection("notifications").insertOne({
    notificationId: crypto.randomUUID(),
    userId,
    icon,
    title,
    description,
    requestId,
    action,
    isRead: false,
    createdAt: new Date(),
  })
}
