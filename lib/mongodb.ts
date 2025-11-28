import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "onbuddy";

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable in .env");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);
const clientPromise: Promise<MongoClient> =
  global._mongoClientPromise || client.connect();

if (!global._mongoClientPromise) {
  global._mongoClientPromise = clientPromise;
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
