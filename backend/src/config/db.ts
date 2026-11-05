import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodInstance: any = null;

export async function connectDB(): Promise<void> {
  let uri = ENV.MONGODB_URI;

  if (!uri) {
    console.log('[Database] No MONGODB_URI provided in environment. Initializing in-memory MongoDB instance for local/demo use...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
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
    console.log('[Database] Successfully connected to MongoDB.');
  } catch (err: any) {
    console.error(`[Database] Connection error to ${uri.startsWith('mongodb+srv') ? 'MongoDB Atlas' : 'MongoDB'}:`, err.message);
    // If Atlas connection failed and in dev, try fallback
    if (!mongodInstance && (ENV.NODE_ENV === 'development' || ENV.NODE_ENV === 'test')) {
      console.log('[Database] Attempting fallback to in-memory MongoDB for local resilience...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const fallbackUri = mongodInstance.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`[Database] Connected to fallback in-memory MongoDB: ${fallbackUri}`);
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
