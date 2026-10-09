import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env based on file location
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also load from current working directory as fallback
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realestate_crm',
  jwtSecret: process.env.JWT_SECRET || 'kodbrand_enterprise_crm_jwt_super_secret_key_2026_realestate',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173')
    .split(',')
    .map(o => o.trim())
};
