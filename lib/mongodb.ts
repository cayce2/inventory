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

const getClientPromise = () => {
  if (clientPromise) return clientPromise

  if (!uri) {
    // Fail only when actually used.
    clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'))
    return clientPromise
  }

  const baseOptions: MongoClientOptions = {
    // Fail fast if the cluster is unreachable — prevents hanging past Vercel's 10 s limit
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 8000,
    // Reuse connections across warm invocations
    maxPoolSize: 10,
    minPoolSize: 1,
  }

  const options: MongoClientOptions =
    process.env.NODE_ENV === "development"
      ? { ...baseOptions, family: 4 } // Force IPv4 in development
      : baseOptions

  if (process.env.NODE_ENV === "development") {
    // Preserve the promise across HMR reloads in dev.
    const globalWithMongo = global as MongoGlobal
    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
    return clientPromise
  }

  // In production, initialize a new client on first use.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
  return clientPromise
}

// Lazy thenable to avoid connecting during build/module evaluation.
const clientPromiseThenable: PromiseLike<MongoClient> = {
  then: (onFulfilled, onRejected) => getClientPromise().then(onFulfilled, onRejected),
}

export default clientPromiseThenable as Promise<MongoClient>

