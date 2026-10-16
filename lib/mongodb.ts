import { MongoClient, MongoClientOptions } from "mongodb"
import dns from "dns"

// Fix DNS resolution for Node.js (Windows and Linux/AWS Lambda IPv6 issue)
dns.setDefaultResultOrder("ipv4first")

const uri = process.env.MONGODB_URI

type MongoGlobal = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

const getClientPromise = () => {
  if (clientPromise) return clientPromise

  if (!uri) {
    clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'))
    return clientPromise
  }

  const options: MongoClientOptions = {
    // Force IPv4 in all environments (prevents AWS Lambda / Vercel IPv6 routing blackholes)
    family: 4,
    // Connection timeouts
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Serverless connection pool tuning
    maxPoolSize: 10,
    minPoolSize: 0, // Serverless environments should never maintain idle connections
    maxIdleTimeMS: 15000,
  }

  const globalWithMongo = global as MongoGlobal

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
      // Clear cached promise on connection failure so next request can retry
      globalWithMongo._mongoClientPromise = undefined
      client = null
      throw err
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
