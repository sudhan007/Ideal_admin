// src/db.ts
import { MongoClient, Db } from "mongodb";
import { APP_CONSTANTS } from "./env.config";

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const uri = APP_CONSTANTS.DATABASE_URL;
  
  client = new MongoClient(uri);
  await client.connect();
  
  db = client.db();
  
  console.log(`MongoDB connected 🦬`);
  
  process.on("SIGINT", async () => {
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  });

  return db;
}

export async function getCollection(name: string) {
  const database = await connectDB();
  return database.collection(name);
}

export async function closeDB() {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
}