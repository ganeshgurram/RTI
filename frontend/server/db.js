import { MongoClient } from "mongodb"

import { seedDatabase } from "./seed.js"

let clientPromise
let databasePromise

function getMongoConnectionUri(uri) {
  const directHosts = process.env.MONGODB_DIRECT_HOSTS
    ?.split(",")
    .map((host) => host.trim())
    .filter(Boolean)
    .join(",")

  if (!directHosts || !uri.startsWith("mongodb+srv://")) return uri

  const match = /^mongodb\+srv:\/\/([^@]+)@[^/]+(\/[^?]*)?(\?.*)?$/i.exec(uri)
  if (!match) return uri

  const [, credentials, databasePath = "/", search = ""] = match
  const parameters = new URLSearchParams(search.slice(1))
  parameters.set("tls", "true")
  if (!parameters.has("authSource")) parameters.set("authSource", "admin")

  const replicaSet = process.env.MONGODB_REPLICA_SET?.trim()
  if (replicaSet) parameters.set("replicaSet", replicaSet)

  return "mongodb://" + credentials + "@" + directHosts + databasePath + "?" + parameters.toString()
}

export async function getDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not configured.")

  if (!clientPromise) {
    const client = new MongoClient(getMongoConnectionUri(uri), {
      maxPoolSize: 10,
      minPoolSize: 0,
      // Atlas can take longer than a few seconds to complete its first TLS and
      // replica-set discovery round, especially on a newly started dev server.
      serverSelectionTimeoutMS: 30_000,
    })
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined
      throw error
    })
  }

  const client = await clientPromise
  return client.db("rti")
}

export async function ensureIndexes(db) {
  await Promise.all([
    db.collection("users").createIndex({ username: 1 }, { unique: true }),
    db.collection("users").createIndex({ "profile.email": 1 }, { unique: true }),
    db.collection("sessions").createIndex({ token: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("requests").createIndex({ requestId: 1 }, { unique: true }),
    db.collection("requests").createIndex({ userId: 1, updatedAt: -1 }),
    db.collection("requests").createIndex({ "applicant.email": 1, requestId: 1 }),
    db.collection("appeals").createIndex({ appealId: 1 }, { unique: true }),
    db.collection("appeals").createIndex({ requestId: 1, createdAt: -1 }),
    db.collection("payments").createIndex({ transactionId: 1 }, { unique: true }),
    db.collection("payments").createIndex({ email: 1, createdAt: -1 }),
    db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
  ])
}

/** Cached per runtime instance so Atlas setup is never repeated for every request. */
export async function prepareDatabase() {
  if (!databasePromise) {
    databasePromise = getDatabase()
      .then(async (db) => {
        await ensureIndexes(db)
        if (process.env.SEED_DEMO_DATA !== "false") await seedDatabase(db)
        return db
      })
      .catch((error) => {
        databasePromise = undefined
        throw error
      })
  }

  return databasePromise
}
