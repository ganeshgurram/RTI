import { MongoClient } from "mongodb"

import { seedDatabase } from "./seed.js"

let clientPromise
let databasePromise

export async function getDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not configured.")

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8_000,
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
