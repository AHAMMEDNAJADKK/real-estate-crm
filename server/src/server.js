import { execSync } from 'child_process';
import app from './app.js';
import { connectDB, disconnectDB } from './config/database.js';
import { config, validateEnvironment } from './config/environment.js';
import { AuthService } from './modules/auth/auth.service.js';
import { startScheduledJobs, stopScheduledJobs } from './jobs/scheduler.js';

const freePortInDev = (port) => {
  if (config.nodeEnv === 'production' || process.platform !== 'win32') return false;
  try {
    const out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = out.split(/\r?\n/).filter((l) => l.includes('LISTENING'));
    let killed = false;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (pid && pid !== process.pid) {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        killed = true;
      }
    }
    return killed;
  } catch {
    return false;
  }
};

const startServer = async () => {
  try {
    validateEnvironment();
    await connectDB();
    await AuthService.seedInitialAdmin();
    startScheduledJobs();

    let retriedPort = false;

    const bindServer = () => {
      const server = app.listen(config.port, '0.0.0.0', () => {
        console.log(`====================================================`);
        console.log(`  🏢 KODBRAND Real Estate CRM Server running!`);
        console.log(`  🚀 Port: ${config.port} | Mode: ${config.nodeEnv}`);
        console.log(`  🌐 Base API: http://localhost:${config.port}/api`);
        console.log(`====================================================`);
      });

      const shutdown = (signal) => {
        console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
        stopScheduledJobs();
        server.close(async () => {
          console.log('[Server] HTTP server closed.');
          try {
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

      process.once('SIGTERM', () => shutdown('SIGTERM'));
      process.once('SIGINT', () => shutdown('SIGINT'));

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && !retriedPort && freePortInDev(config.port)) {
          retriedPort = true;
          setTimeout(bindServer, 400);
          return;
        }
        if (err.code === 'EADDRINUSE') {
          console.error(`[Server Error]: Port ${config.port} is already in use. Please free port ${config.port} or change PORT in .env.`);
        } else {
          console.error('[Server Error]:', err.message);
        }
        process.exit(1);
      });
    };

    bindServer();
  } catch (error) {
    console.error('Fatal startup error:', error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;

