import app from "./app.js"
import { prepareDatabase } from "./db.js"

const port = Number(process.env.PORT ?? 8787)

const retryDelayMs = 5_000

async function startServer() {
  try {
    await prepareDatabase()
    app.listen(port, "127.0.0.1", () => {
      console.log("RTI API listening on http://127.0.0.1:" + port)
    })
  } catch (error) {
    console.error("Unable to connect to MongoDB. Retrying in " + retryDelayMs / 1_000 + " seconds.", error)
    setTimeout(startServer, retryDelayMs)
  }
}

startServer()
