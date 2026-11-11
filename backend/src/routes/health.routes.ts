import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ENV } from '../config/env.js';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const isGroq = ENV.AI_PROVIDER === 'groq';

  res.json({
    status: 'healthy',
    application: 'BrandLens AI API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'brandlens',
    },
    aiService: {
      provider: isGroq ? 'Groq' : 'Google Gemini',
      model: isGroq ? ENV.GROQ_MODEL : ENV.GEMINI_MODEL,
      configured: Boolean(isGroq ? ENV.GROQ_API_KEY : ENV.GEMINI_API_KEY),
    },
  });
});

export default router;

