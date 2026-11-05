import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { SeedService } from './services/seed.service.js';
import { Organisation } from './models/Organisation.js';

const app = createApp();

async function startServer() {
  try {
    console.log('[BrandLens AI] Initializing backend services...');
    await connectDB();

    // Check if initial demo seed is needed
    const orgCount = await Organisation.countDocuments();
    if (orgCount === 0) {
      console.log('[BrandLens AI] Empty database detected. Seeding initial demo organisation and sample brand guidelines...');
      try {
        await SeedService.seedDemoData();
      } catch (seedErr: any) {
        console.warn('[BrandLens AI] Automatic demo seeding warning:', seedErr.message);
      }
    }

    const server = app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 BrandLens AI API Server running on port ${ENV.PORT}`);
      console.log(`🌐 Health endpoint: http://localhost:${ENV.PORT}/api/health`);
      console.log(`🎯 Frontend Origin: ${ENV.FRONTEND_URL}`);
      console.log(`🔑 Gemini Configured: ${Boolean(ENV.GEMINI_API_KEY)}`);
      console.log(`====================================================`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[BrandLens AI] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[BrandLens AI] Server and database closed. Bye!');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err: any) {
    console.error('[BrandLens AI] Fatal initialization error:', err.message);
    process.exit(1);
  }
}

startServer();
