import { MongoClient, MongoClientOptions } from "mongodb"
import dns from "dns"

// Fix DNS resolution for Windows/Node.js
if (process.env.NODE_ENV === "development") {
  dns.setDefaultResultOrder("ipv4first")
}

const uri = process.env.MONGODB_URI

type MongoGlobal = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null
let indexesEnsured = false

function ensureIndexes(cl: MongoClient) {
  if (indexesEnsured) return
  indexesEnsured = true
  try {
    const db = cl.db("inventory_management")
    Promise.all([
      db.collection("inventory").createIndex({ userId: 1 }),
      db.collection("inventory").createIndex({ userId: 1, sku: 1 }),
      db.collection("invoices").createIndex({ userId: 1, deleted: 1 }),
      db.collection("invoices").createIndex({ userId: 1, status: 1, createdAt: -1 }),
      db.collection("sales").createIndex({ userId: 1 }),
    ]).catch((err) => console.error("Index creation error (non-blocking):", err))
  } catch (err) {
    console.error("Failed to trigger index creation:", err)
  }
}

const getClientPromise = () => {
  if (clientPromise) return clientPromise

  if (!uri) {
    clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'))
    return clientPromise
  }

  const baseOptions: MongoClientOptions = {
    // Fail fast if the cluster is unreachable — prevents hanging past Vercel's limit
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 8000,
    maxPoolSize: 10,
    minPoolSize: 1,
  }

  const options: MongoClientOptions =
    process.env.NODE_ENV === "development"
      ? { ...baseOptions, family: 4 } // Force IPv4 in development
      : baseOptions

  const globalWithMongo = global as MongoGlobal

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().then((c) => {
      ensureIndexes(c)
      return c
    })
  }

  clientPromise = globalWithMongo._mongoClientPromise
  return clientPromise
}

// Lazy thenable to avoid connecting during build/module evaluation.
const clientPromiseThenable: PromiseLike<MongoClient> = {
  then: (onFulfilled, onRejected) => getClientPromise().then(onFulfilled, onRejected),
}

export default clientPromiseThenable as Promise<MongoClient>
