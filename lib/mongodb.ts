import { MongoClient } from "mongodb"

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

  if (process.env.NODE_ENV === "development") {
    // Preserve the promise across HMR reloads in dev.
    const globalWithMongo = global as MongoGlobal
    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
    return clientPromise
  }

  // In production, initialize a new client on first use.
  client = new MongoClient(uri)
  clientPromise = client.connect()
  return clientPromise
}

// Lazy thenable to avoid connecting during build/module evaluation.
const clientPromiseThenable: PromiseLike<MongoClient> = {
  then: (onFulfilled, onRejected) => getClientPromise().then(onFulfilled, onRejected),
}

export default clientPromiseThenable as Promise<MongoClient>

