import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV, isDev } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Route imports
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import reviewRoutes from './routes/review.routes.js';
import factRoutes from './routes/fact.routes.js';
import orgRoutes from './routes/org.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isDev ? false : undefined,
    })
  );

  // 2. CORS Configuration
  const allowedOrigins = [
    ENV.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error(`CORS origin policy blocked request from: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Request Logging
  if (!process.env.VITEST) {
    app.use(morgan(isDev ? 'dev' : 'combined'));
  }

  // 5. Global Rate Limiter
  app.use('/api', generalLimiter);

  // 6. Routes
  app.use('/', healthRoutes);
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/review', reviewRoutes);
  app.use('/api/facts', factRoutes);
  app.use('/api/org', orgRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // 7. 404 Handler
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route '${req.originalUrl}' not found.`,
    });
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

