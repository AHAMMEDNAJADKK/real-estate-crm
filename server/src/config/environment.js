import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env based on file location without overriding existing environment variables (e.g. Render)
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false });
// Also load from current working directory as fallback without overriding existing environment variables
dotenv.config({ override: false });

const WEAK_PRODUCTION_JWT_SECRETS = new Set([
  'your_super_secret_jwt_key_here_change_in_production',
  'kodbrand_enterprise_crm_jwt_super_secret_key_2026_realestate',
  'changeme',
  'secret',
  'jwt_secret'
]);

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

export const isLocalhostMongoUri = (uri = '') =>
  /^mongodb(?:\+srv)?:\/\/(?:[^@]+@)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    String(uri).trim()
  );

export const validateMongoUri = (rawUri, { nodeEnv = config.nodeEnv } = {}) => {
  const uri = typeof rawUri === 'string' ? rawUri.trim() : '';

  if (!uri) {
    throw new Error(
      'MongoDB connection URI is missing. Set MONGODB_URI in server/.env for development or in Render environment variables for production.'
    );
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error(
      'Invalid MONGODB_URI format. Connection string must begin with mongodb:// or mongodb+srv://.'
    );
  }

  if (/<username>|<password>|<cluster>|<db_password>/i.test(uri)) {
    throw new Error(
      'MONGODB_URI contains unconfigured placeholder values. Replace placeholders with valid MongoDB credentials.'
    );
  }

  if (/\/edtech_crm(?:\?|$)/i.test(uri)) {
    throw new Error(
      'Invalid database "edtech_crm" in MONGODB_URI. Configure "realestate_crm" as the target database.'
    );
  }

  if (nodeEnv === 'production' && isLocalhostMongoUri(uri)) {
    throw new Error(
      'Localhost MongoDB URI is not allowed when NODE_ENV=production. Configure a valid MongoDB Atlas MONGODB_URI.'
    );
  }

  return uri;
};

export const validateJwtSecret = (rawSecret = config.jwtSecret, { nodeEnv = config.nodeEnv } = {}) => {
  const secret = typeof rawSecret === 'string' ? rawSecret.trim() : '';

  if (!secret) {
    throw new Error(
      'JWT_SECRET is missing. Configure a strong JWT_SECRET in your environment variables.'
    );
  }

  if (nodeEnv === 'production') {
    if (secret.length < 32 || WEAK_PRODUCTION_JWT_SECRETS.has(secret)) {
      throw new Error(
        'A strong, unique JWT_SECRET (minimum 32 characters) is required when NODE_ENV=production.'
      );
    }
  }

  return secret;
};

export const validateEnvironment = () => {
  const nodeEnv = config.nodeEnv;
  validateMongoUri(config.mongoUri, { nodeEnv });
  validateJwtSecret(config.jwtSecret, { nodeEnv });
};

export const config = {
  get port() {
    return process.env.PORT || 5000;
  },
  get nodeEnv() {
    return (process.env.NODE_ENV || 'development').trim();
  },
  get mongoUri() {
    const uri =
      process.env.MONGODB_URI !== undefined
        ? process.env.MONGODB_URI
        : process.env.MONGO_URI;
    return (uri || '').trim();
  },
  get jwtSecret() {
    const secret = (process.env.JWT_SECRET || '').trim();
    if (secret) return secret;
    if ((process.env.NODE_ENV || 'development').trim() === 'test') {
      return 'test_only_jwt_secret_key_for_automated_tests_32chars';
    }
    return '';
  },
  get jwtExpiresIn() {
    return (process.env.JWT_EXPIRES_IN || '7d').trim();
  },
  get allowedOrigins() {
    const raw = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '').trim();
    const isProd = (process.env.NODE_ENV || 'development').trim() === 'production';

    if (raw) {
      const parsed = raw
        .split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter((o) => Boolean(o) && (!isProd || o !== '*'));
      return parsed;
    }

    return isProd ? [] : [...DEFAULT_DEV_ORIGINS];
  }
};

