import app from "./app.js"
import { prepareDatabase } from "./db.js"

const port = Number(process.env.PORT ?? 8787)

prepareDatabase()
  .then(() =>
    app.listen(port, "127.0.0.1", () => {
      console.log(`RTI API listening on http://127.0.0.1:${port}`)
    }),
  )
  .catch((error) => {
    console.error("Unable to start RTI API", error)
    process.exit(1)
  })
