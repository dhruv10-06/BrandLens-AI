import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV, isProd } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongodInstance: any = null;

export async function connectDB(): Promise<void> {
  let uri = ENV.MONGODB_URI;

  if (!uri) {
    if (isProd) {
      throw new Error(
        'FATAL: MONGODB_URI is not configured. Ephemeral in-memory database is strictly disabled in production.'
      );
    }

    console.log('[Database] No MONGODB_URI provided in environment. Initializing local in-memory MongoDB instance for local testing...');
    try {
      if (!process.env.MONGOMS_DOWNLOAD_DIR) {
        process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../node_modules/.cache/mongodb-memory-server');
      }
      const memPkg = 'mongodb-memory-server';
      const { MongoMemoryServer } = await import(memPkg);
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`[Database] In-memory MongoDB running at: ${uri}`);
    } catch (err: any) {
      console.error('[Database] Failed to start in-memory MongoDB:', err.message);
      throw new Error(
        'MONGODB_URI is not set and MongoMemoryServer could not be started. Please specify a valid MONGODB_URI in .env.'
      );
    }
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[Database] Successfully connected to ${uri.startsWith('mongodb+srv') ? 'MongoDB Atlas' : 'MongoDB'}.`);
  } catch (err: any) {
    console.error(`[Database] Fatal connection error to ${uri.startsWith('mongodb+srv') ? 'MongoDB Atlas' : 'MongoDB'}:`, err.message);

    if (isProd) {
      throw new Error(`Production database connection failed: ${err.message}. Persistent database required.`);
    }

    // In dev or test only, try fallback if atlas failed
    if (!mongodInstance && (ENV.NODE_ENV === 'development' || ENV.NODE_ENV === 'test')) {
      console.log('[Database] Attempting dev fallback to in-memory MongoDB...');
      const memPkg = 'mongodb-memory-server';
      const { MongoMemoryServer } = await import(memPkg);
      mongodInstance = await MongoMemoryServer.create();
      const fallbackUri = mongodInstance.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`[Database] Connected to dev fallback in-memory MongoDB: ${fallbackUri}`);
      return;
    }
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}
