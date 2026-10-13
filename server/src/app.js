import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = origin.trim().replace(/\/+$/, '');
  const isProd = config.nodeEnv === 'production';
  const configuredOrigins = config.allowedOrigins;

  for (const allowed of configuredOrigins) {
    if (!allowed) continue;
    if (!isProd && allowed === '*') return true;
    if (allowed === normalizedOrigin) return true;

    // Support intentional preview domain pattern only when explicitly configured (e.g. https://my-app-*.vercel.app)
    if (allowed.includes('*') && allowed !== '*') {
      const regexPattern =
        '^' +
        allowed
          .split('*')
          .map((segment) => segment.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
          .join('[a-zA-Z0-9-]+') +
        '$';
      if (new RegExp(regexPattern, 'i').test(normalizedOrigin)) {
        return true;
      }
    }
  }

  if (!isProd) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin)) {
      return true;
    }
  }

  return false;
};

// CORS Configuration supporting configured local origins in development and strict origins in production
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      const corsError = new Error('Origin not allowed by CORS policy');
      corsError.statusCode = 403;
      return callback(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  })
);

// Parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Static files for document & property photo uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check reflecting live backend and MongoDB connection status
app.get(['/health', '/api/health'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status: isDbConnected ? 'healthy' : 'unhealthy',
    service: 'KODBRAND Real Estate CRM Backend',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});


app.get('/', (req, res) => {
  res.status(200).json({
    message: 'KODBRAND Enterprise ERP — Real Estate CRM API Server',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api', apiRoutes);
app.use('/api/v1', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route Not Found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
