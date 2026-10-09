import app from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/environment.js';
import { AuthService } from './modules/auth/auth.service.js';
import { startScheduledJobs } from './jobs/scheduler.js';

const startServer = async () => {
  try {
    await connectDB();
    await AuthService.seedInitialAdmin();
    startScheduledJobs();

    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  🏢 KODBRAND Real Estate CRM Server running!`);
      console.log(`  🚀 Port: ${config.port} | Mode: ${config.nodeEnv}`);
      console.log(`  🌐 Base API: http://localhost:${config.port}/api`);
      console.log(`====================================================`);
    });

    const shutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          const { disconnectDB } = await import('./config/database.js');
          await disconnectDB();
        } catch (e) {
          console.error('[Server] Error disconnecting DB:', e.message);
        }
        process.exit(0);
      });
      setTimeout(() => {
        console.error('[Server] Forcefully terminating after timeout');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error]: Port ${config.port} is already in use. Please free port ${config.port} or change PORT in .env.`);
      } else {
        console.error('[Server Error]:', err.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Fatal startup error:', error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
