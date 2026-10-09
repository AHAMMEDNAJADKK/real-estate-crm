import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS Configuration supporting Localhost, Vercel deployments, and custom domains
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVercel = origin.endsWith('.vercel.app');
    const isConfigured = config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*');
    if (isLocalhost || isVercel || isConfigured) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Static files for document & property photo uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'KODBRAND Real Estate CRM Backend'
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
