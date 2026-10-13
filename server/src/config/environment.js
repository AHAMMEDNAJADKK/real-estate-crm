import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local .env files without overriding platform-injected environment variables (e.g. Render)
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false });
dotenv.config({ override: false });

const WEAK_PRODUCTION_JWT_SECRETS = new Set([
  'your_super_secret_jwt_key_here_change_in_production',
  'kodbrand_enterprise_crm_jwt_super_secret_key_2026_realestate',
  'super_secret_jwt_key_kodbrand_enterprise_2026',
  'superadmin@111',
  'Password@123',
  'changeme',
  'secret',
  'jwt_secret'
]);

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

export const isRenderRuntime = () =>
  Boolean(
    process.env.RENDER === 'true' ||
      process.env.RENDER_SERVICE_ID ||
      process.env.RENDER_EXTERNAL_URL
  );

const stripWrappingQuotes = (val = '') =>
  String(val)
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();

export const isLocalhostMongoUri = (uri = '') =>
  /^mongodb(?:\+srv)?:\/\/(?:[^@]+@)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    stripWrappingQuotes(uri)
  );

export const validateMongoUri = (
  rawUri,
  { nodeEnv = config.nodeEnv, isRender = isRenderRuntime() } = {}
) => {
  const uri = typeof rawUri === 'string' ? stripWrappingQuotes(rawUri) : '';
  const isProdOrRender = nodeEnv === 'production' || isRender;

  if (!uri) {
    throw new Error(
      'MongoDB connection URI is missing. Set MONGODB_URI (your MongoDB Atlas connection string) in Render Environment Variables for production or in server/.env for local development.'
    );
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error(
      'Invalid MONGODB_URI format. Connection string must begin with mongodb:// or mongodb+srv://.'
    );
  }

  if (/<username>|<password>|<cluster>|<db_password>/i.test(uri)) {
    throw new Error(
      'MONGODB_URI contains unconfigured placeholder values. Replace placeholders with valid MongoDB Atlas credentials.'
    );
  }

  if (/\/edtech_crm(?:\?|$)/i.test(uri)) {
    throw new Error(
      'Invalid database "edtech_crm" in MONGODB_URI. Configure "realestate_crm" as the target database.'
    );
  }

  if (isProdOrRender && isLocalhostMongoUri(uri)) {
    throw new Error(
      'Localhost MongoDB URI is not allowed in production or on Render (127.0.0.1 / localhost). Configure a valid MongoDB Atlas MONGODB_URI (mongodb+srv://...) in your Render Dashboard Environment Variables.'
    );
  }

  return uri;
};

export const validateJwtSecret = (
  rawSecret = config.jwtSecret,
  { nodeEnv = config.nodeEnv, isRender = isRenderRuntime() } = {}
) => {
  const secret = typeof rawSecret === 'string' ? stripWrappingQuotes(rawSecret) : '';
  const isProdOrRender = nodeEnv === 'production' || isRender;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is missing. Configure a strong JWT_SECRET (minimum 32 characters) in your environment variables.'
    );
  }

  if (isProdOrRender) {
    if (WEAK_PRODUCTION_JWT_SECRETS.has(secret)) {
      throw new Error(
        'A strong, unique JWT_SECRET (minimum 32 characters) is required in production. Do not use default placeholder secrets or account passwords; configure a unique cryptographically random secret in Render Environment Variables.'
      );
    }
    if (secret.length < 32) {
      throw new Error(
        `A strong, unique JWT_SECRET (minimum 32 characters) is required in production (current length: ${secret.length}).`
      );
    }
  }

  return secret;
};

export const validateEnvironment = () => {
  const nodeEnv = config.nodeEnv;
  const isRender = isRenderRuntime();
  validateMongoUri(config.mongoUri, { nodeEnv, isRender });
  validateJwtSecret(config.jwtSecret, { nodeEnv, isRender });
};

export const config = {
  get port() {
    return Number(process.env.PORT) || 5000;
  },
  get nodeEnv() {
    const rawEnv = stripWrappingQuotes(process.env.NODE_ENV || '');
    if (rawEnv === 'test') return 'test';
    if (isRenderRuntime()) return 'production';
    return rawEnv || 'development';
  },
  get mongoUri() {
    const candidates = [
      process.env.MONGODB_URI,
      process.env.MONGO_URI,
      process.env.MONGODB_URL,
      process.env.MONGO_URL,
      process.env.DATABASE_URL
    ];
    const found = candidates.find((v) => v !== undefined && String(v).trim() !== '');
    return found !== undefined ? stripWrappingQuotes(found) : '';
  },
  get jwtSecret() {
    const secret = stripWrappingQuotes(process.env.JWT_SECRET || '');
    if (secret) return secret;
    if (this.nodeEnv === 'test') {
      return 'test_only_jwt_secret_key_for_automated_tests_32chars';
    }
    return '';
  },
  get jwtExpiresIn() {
    return stripWrappingQuotes(process.env.JWT_EXPIRES_IN || '7d') || '7d';
  },
  get allowedOrigins() {
    const rawParts = [
      process.env.ALLOWED_ORIGINS,
      process.env.CORS_ORIGIN,
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL
    ]
      .filter(Boolean)
      .join(',');

    const isProd = this.nodeEnv === 'production';

    if (rawParts.trim()) {
      const parsed = rawParts
        .split(',')
        .map((o) => stripWrappingQuotes(o).replace(/\/+$/, ''))
        .filter((o) => Boolean(o) && (!isProd || o !== '*'));
      return [...new Set(parsed)];
    }

    return isProd ? [] : [...DEFAULT_DEV_ORIGINS];
  }
};


