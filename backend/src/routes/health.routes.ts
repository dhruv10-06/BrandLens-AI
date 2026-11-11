import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ENV } from '../config/env.js';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

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
      provider: 'Google Gemini',
      model: ENV.GEMINI_MODEL,
      configured: Boolean(ENV.GEMINI_API_KEY),
    },
  });
});

export default router;

