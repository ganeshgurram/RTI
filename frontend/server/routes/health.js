import { Router } from "express"

export const healthRouter = Router()

healthRouter.get("/", async (request, response, next) => {
  try {
    await request.db.command({ ping: 1 })
    response.json({ status: "ok", database: "connected" })
  } catch (error) {
    next(error)
  }
})
