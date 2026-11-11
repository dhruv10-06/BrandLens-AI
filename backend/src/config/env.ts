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

/**
 * Validates AI provider configuration at startup.
 * Throws a fatal error if provider is invalid or if Groq is selected without GROQ_API_KEY.
 */
export function validateAIProvider(provider?: string, groqKey?: string): 'gemini' | 'groq' {
  const normalized = (provider || 'gemini').trim().toLowerCase();
  if (normalized !== 'gemini' && normalized !== 'groq') {
    throw new Error(
      `FATAL CONFIGURATION ERROR: Invalid AI_PROVIDER "${provider}". Supported providers are "gemini" and "groq".`
    );
  }
  if (normalized === 'groq' && !groqKey) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: AI_PROVIDER is set to "groq", but GROQ_API_KEY is not defined. Please set GROQ_API_KEY in your environment.'
    );
  }
  return normalized as 'gemini' | 'groq';
}

const rawProvider = process.env.AI_PROVIDER || 'gemini';
const validatedProvider = validateAIProvider(rawProvider, process.env.GROQ_API_KEY);

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

  if (validatedProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
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
  get AI_PROVIDER(): 'gemini' | 'groq' {
    const raw = (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();
    return raw === 'groq' ? 'groq' : 'gemini';
  },
  set AI_PROVIDER(val: 'gemini' | 'groq') {
    process.env.AI_PROVIDER = val;
  },
  get GEMINI_API_KEY(): string {
    return process.env.GEMINI_API_KEY || '';
  },
  set GEMINI_API_KEY(val: string) {
    process.env.GEMINI_API_KEY = val;
  },
  get GEMINI_MODEL(): string {
    return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  },
  set GEMINI_MODEL(val: string) {
    process.env.GEMINI_MODEL = val;
  },
  get GROQ_API_KEY(): string {
    return process.env.GROQ_API_KEY || '';
  },
  set GROQ_API_KEY(val: string) {
    process.env.GROQ_API_KEY = val;
  },
  get GROQ_MODEL(): string {
    return process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  },
  set GROQ_MODEL(val: string) {
    process.env.GROQ_MODEL = val;
  },
  GEMINI_TIMEOUT_MS: validatedGeminiTimeout,
  GEMINI_PER_ATTEMPT_TIMEOUT_MS: validatedGeminiPerAttemptTimeout,
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
};

export const isDev = ENV.NODE_ENV === 'development';
export const isTest = ENV.NODE_ENV === 'test';
export const isProd = isProduction;
