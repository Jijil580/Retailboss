import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB ?? "retailboss";

type MongoCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var retailBossMongo: MongoCache | undefined;
}

const cache = global.retailBossMongo ?? {
  connection: null,
  promise: null,
};

global.retailBossMongo = cache;

export async function connectMongo() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (cache.connection) return cache.connection;

  cache.promise ??= mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB.trim(),
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8_000,
  });

  try {
    cache.connection = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.connection;
}
