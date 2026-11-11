import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env first, then fallback to current directory .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const DEFAULT_DEV_SECRET = 'brandlens-ai-secure-jwt-secret-key-development-2026';

// Validate Production Security Controls
if (isProduction) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === DEFAULT_DEV_SECRET || jwtSecret.length < 32) {
    throw new Error(
      'FATAL SECURITY ERROR: In production, JWT_SECRET must be explicitly set to a cryptographically secure key of at least 32 characters. Default/insecure secret was rejected.'
    );
  }

  if (!process.env.MONGODB_URI) {
    throw new Error(
      'FATAL SECURITY ERROR: In production, MONGODB_URI is required. Ephemeral in-memory databases are strictly prohibited in production.'
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: In production, GEMINI_API_KEY must be provided for AI brand governance.'
    );
  }
}

const parsedGeminiTimeout = parseInt(process.env.GEMINI_TIMEOUT_MS || '', 10);
const validatedGeminiTimeout = Number.isFinite(parsedGeminiTimeout) && parsedGeminiTimeout >= 5000 ? parsedGeminiTimeout : 60000;

const parsedGeminiPerAttemptTimeout = parseInt(process.env.GEMINI_PER_ATTEMPT_TIMEOUT_MS || '', 10);
const validatedGeminiPerAttemptTimeout =
  Number.isFinite(parsedGeminiPerAttemptTimeout) && parsedGeminiPerAttemptTimeout >= 3000
    ? parsedGeminiPerAttemptTimeout
    : 20000;

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_DEV_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  GEMINI_TIMEOUT_MS: validatedGeminiTimeout,
  GEMINI_PER_ATTEMPT_TIMEOUT_MS: validatedGeminiPerAttemptTimeout,
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
};

export const isDev = ENV.NODE_ENV === 'development';
export const isTest = ENV.NODE_ENV === 'test';
export const isProd = isProduction;
