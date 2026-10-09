import app from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/environment.js';
import { AuthService } from './modules/auth/auth.service.js';

const startServer = async () => {
  try {
    await connectDB();
    await AuthService.seedInitialAdmin();

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`  🏢 KODBRAND Real Estate CRM Server running!`);
      console.log(`  🚀 Port: ${config.port} | Mode: ${config.nodeEnv}`);
      console.log(`  🌐 Base API: http://localhost:${config.port}/api`);
      console.log(`====================================================`);
    });

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
