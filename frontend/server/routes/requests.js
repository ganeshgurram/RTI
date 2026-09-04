import { Router } from "express"

import { cleanEmail, requestView } from "../lib/formatters.js"
import { requireAuth } from "../middleware/auth.js"
import { addNotification } from "../services/notifications.js"

function newId(prefix) {
  return `${prefix}-${new Date().getUTCFullYear()}-${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 10)}`
}

export const requestsRouter = Router()
export const publicRequestsRouter = Router()

requestsRouter.get("/", requireAuth, async (request, response, next) => {
  try {
    const page = Math.max(1, Number(request.query.page ?? 1))
    const limit = Math.min(50, Math.max(1, Number(request.query.limit ?? 50)))
    const filter = { userId: request.user._id }
    const [records, total] = await Promise.all([
      request.db.collection("requests").find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      request.db.collection("requests").countDocuments(filter),
    ])
    response.json({ requests: records.map(requestView), total, page, limit })
  } catch (error) {
    next(error)
  }
})

requestsRouter.post("/", requireAuth, async (request, response, next) => {
  try {
    const input = request.body ?? {}
    const subject = String(input.subject ?? "").trim().replace(/\s+/g, " ").slice(0, 120)
    const requestText = String(input.requestText ?? "").trim()
    const authority = String(input.authority ?? "").trim()
    if (!subject || !requestText || !authority) return response.status(400).json({ error: "invalidRequest" })

    const now = new Date()
    const record = {
      requestId: newId("RTI"),
      userId: request.user._id,
      applicant: {
        name: String(input.applicantName ?? request.user.profile.fullName),
        email: cleanEmail(input.applicantEmail ?? request.user.profile.email),
        phone: String(input.applicantPhone ?? request.user.profile.mobile),
      },
      authority,
      ministry: String(input.ministry ?? ""),
      subject,
      requestText,
      isBplApplicant: Boolean(input.isBplApplicant),
      supportingDocumentName: input.supportingDocumentName ? String(input.supportingDocumentName) : undefined,
      status: "Pending Verification",
      nextAction: "Awaiting assignment to the concerned CPIO",
      createdAt: now,
      updatedAt: now,
      timeline: [{ label: "Application submitted", createdAt: now }],
    }
    await request.db.collection("requests").insertOne(record)
    await addNotification(request.db, {
      userId: request.user._id,
      icon: "description",
      title: "Application acknowledgement generated",
      description: "Your RTI application has been registered successfully.",
      requestId: record.requestId,
    })
    response.status(201).json({ request: requestView(record) })
  } catch (error) {
    next(error)
  }
})

publicRequestsRouter.get("/:requestId", async (request, response, next) => {
  try {
    const email = cleanEmail(request.query.email)
    const record = await request.db.collection("requests").findOne({ requestId: request.params.requestId.toUpperCase(), "applicant.email": email })
    if (!record) return response.status(404).json({ error: "notFound" })
    response.json({ request: requestView(record) })
  } catch (error) {
    next(error)
  }
})

requestsRouter.post("/:requestId/appeals", requireAuth, async (request, response, next) => {
  try {
    const original = await request.db.collection("requests").findOne({ requestId: request.params.requestId, userId: request.user._id })
    if (!original) return response.status(404).json({ error: "notFound" })

    const now = new Date()
    const appealText = String(request.body?.appealText ?? "").trim()
    if (!appealText) return response.status(400).json({ error: "appealTextRequired" })

    const appealId = newId("RTI-A")
    const appeal = {
      appealId,
      requestId: original.requestId,
      userId: request.user._id,
      appealText,
      ground: String(request.body?.ground ?? ""),
      createdAt: now,
    }
    const appealRequest = {
      requestId: appealId,
      userId: request.user._id,
      applicant: original.applicant,
      authority: original.authority,
      subject: `First appeal: ${original.subject}`,
      requestText: appealText,
      isBplApplicant: original.isBplApplicant,
      status: "First Appeal Filed",
      nextAction: "Awaiting review by the First Appellate Authority",
      createdAt: now,
      updatedAt: now,
      timeline: [{ label: "First appeal submitted", createdAt: now }],
    }
    await request.db.collection("appeals").insertOne(appeal)
    await request.db.collection("requests").insertOne(appealRequest)
    await addNotification(request.db, {
      userId: request.user._id,
      icon: "gavel",
      title: "First appeal acknowledgement generated",
      description: "Your first appeal has been filed and is available in Request History.",
      requestId: appealId,
    })
    response.status(201).json({ appeal: requestView(appealRequest) })
  } catch (error) {
    next(error)
  }
})
