import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config, isOriginAllowed } from './config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

export const corsOptions = {
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
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  optionsSuccessStatus: 204
};

// CORS middleware executing before routes, authentication middleware, and error handlers
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
