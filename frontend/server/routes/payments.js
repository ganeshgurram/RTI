import { Router } from "express"

import { cleanEmail, normaliseMobile, paymentView } from "../lib/formatters.js"
import { requireAuth } from "../middleware/auth.js"

export const paymentsRouter = Router()

paymentsRouter.get("/reconcile", async (request, response, next) => {
  try {
    const email = cleanEmail(request.query.email)
    const mobile = normaliseMobile(request.query.mobile)
    const filter = { email, ...(mobile ? { mobile } : {}) }
    const payment = await request.db.collection("payments").find(filter).sort({ createdAt: -1 }).limit(1).next()
    if (!payment) return response.status(404).json({ error: "notFound" })
    response.json({ payment: paymentView(payment) })
  } catch (error) {
    next(error)
  }
})

paymentsRouter.get("/", requireAuth, async (request, response, next) => {
  try {
    const payments = await request.db.collection("payments").find({ userId: request.user._id }).sort({ createdAt: -1 }).toArray()
    response.json({ payments: payments.map(paymentView) })
  } catch (error) {
    next(error)
  }
})

paymentsRouter.post("/", requireAuth, async (request, response, next) => {
  try {
    const { draft = {}, outcome = "confirmed" } = request.body ?? {}
    if (!['confirmed', 'awaitingBank', 'refunded'].includes(outcome)) return response.status(400).json({ error: "invalidPaymentOutcome" })

    const now = new Date()
    const record = {
      transactionId: `TXN_${String(Date.now()).slice(-7)}`,
      userId: request.user._id,
      applicantName: String(draft.applicantName ?? request.user.profile.fullName),
      email: cleanEmail(draft.applicantEmail ?? request.user.profile.email),
      mobile: normaliseMobile(draft.applicantPhone ?? request.user.profile.mobile),
      amount: "₹ 10.00",
      method: "Mock payment gateway",
      authority: String(draft.authority ?? ""),
      purpose: "RTI application fee",
      outcome,
      refundReference: outcome === "refunded" ? `RRN-${String(Date.now()).slice(-10)}` : undefined,
      createdAt: now,
      updatedAt: now,
    }
    await request.db.collection("payments").insertOne(record)
    response.status(201).json({ payment: paymentView(record) })
  } catch (error) {
    next(error)
  }
})

paymentsRouter.patch("/:transactionId/confirm", requireAuth, async (request, response, next) => {
  try {
    const registrationNumber = String(request.body?.registrationNumber ?? "").trim()
    const payment = await request.db.collection("payments").findOneAndUpdate(
      { transactionId: request.params.transactionId, userId: request.user._id },
      { $set: { outcome: "confirmed", registrationNumber, updatedAt: new Date() } },
      { returnDocument: "after" },
    )
    if (!payment) return response.status(404).json({ error: "notFound" })
    response.json({ payment: paymentView(payment) })
  } catch (error) {
    next(error)
  }
})
