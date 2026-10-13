import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { connectDB, disconnectDB, diagnoseMongoError, sanitizeMongoError } from '../../src/config/database.js';
import { validateMongoUri, validateJwtSecret } from '../../src/config/environment.js';

test('Integration Tests: System Health, Environment & Company Settings', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_health');

  // Setup test admin user
  await User.deleteMany({ email: 'settings_admin@kodbrand.com' });
  await User.create({
    name: 'Settings Admin',
    email: 'settings_admin@kodbrand.com',
    phone: '9876550001',
    password: 'Password@123',
    role: 'super_admin'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'settings_admin@kodbrand.com', password: 'Password@123' });
  const token = loginRes.body.data.token;

  await t.test('GET /health returns healthy status for Render liveness probes', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.database, 'connected');
    assert.ok(res.body.timestamp);
    assert.ok(res.body.service);
  });

  await t.test('GET /api/health returns healthy status for API health monitors', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.database, 'connected');
  });

  await t.test('Super Admin retrieves system settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.companyName);
  });

  await t.test('Super Admin updates system configuration', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: 'KODBRAND Realty Enterprises Pvt Ltd',
        reservationExpiryHours: 48,
        standardCommissionPercentage: 2.5
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.companyName, 'KODBRAND Realty Enterprises Pvt Ltd');
    assert.equal(res.body.data.reservationExpiryHours, 48);
  });

  await t.test('Production CORS allows configured origin and rejects unauthorized origins', async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevOrigins = process.env.ALLOWED_ORIGINS;
    try {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://kodbrand-realestate-crm.vercel.app';

      const allowedRes = await request(app)
        .get('/api/health')
        .set('Origin', 'https://kodbrand-realestate-crm.vercel.app');
      assert.equal(allowedRes.status, 200);
      assert.equal(allowedRes.headers['access-control-allow-origin'], 'https://kodbrand-realestate-crm.vercel.app');

      const blockedRes = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-attacker.vercel.app');
      assert.equal(blockedRes.status, 403);
      assert.equal(blockedRes.headers['access-control-allow-origin'], undefined);
    } finally {
      if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prevNodeEnv;
      if (prevOrigins === undefined) delete process.env.ALLOWED_ORIGINS;
      else process.env.ALLOWED_ORIGINS = prevOrigins;
    }
  });

  await t.test('Environment validation rejects missing URI, edtech_crm, and localhost in production', async () => {
    assert.throws(() => validateMongoUri(''), /missing/i);
    assert.throws(
      () => validateMongoUri('mongodb://127.0.0.1:27017/edtech_crm', { nodeEnv: 'development' }),
      /edtech_crm/i
    );
    assert.throws(
      () => validateMongoUri('mongodb://127.0.0.1:27017/realestate_crm', { nodeEnv: 'production' }),
      /Localhost MongoDB URI is not allowed/i
    );
    assert.throws(
      () => validateMongoUri('mongodb://127.0.0.1:27017/realestate_crm', { nodeEnv: 'development', isRender: true }),
      /Localhost MongoDB URI is not allowed/i
    );
    assert.throws(() => validateJwtSecret('', { nodeEnv: 'production' }), /missing/i);
    assert.throws(
      () => validateJwtSecret('kodbrand_enterprise_crm_jwt_super_secret_key_2026_realestate', { nodeEnv: 'production' }),
      /strong, unique JWT_SECRET/i
    );
    assert.throws(
      () => validateJwtSecret('your_super_secret_jwt_key_here_change_in_production', { nodeEnv: 'production' }),
      /strong, unique JWT_SECRET/i
    );
    assert.throws(
      () => validateJwtSecret('superadmin@111', { nodeEnv: 'production' }),
      /strong, unique JWT_SECRET/i
    );
    assert.throws(
      () => validateJwtSecret('short_secret_under_32_chars', { nodeEnv: 'production' }),
      /strong, unique JWT_SECRET/i
    );

    const validProdSecret = '9f8e7d6c5b4a392817263544536271809f8e7d6c5b4a39281726354453627180';
    assert.equal(validateJwtSecret(validProdSecret, { nodeEnv: 'production' }), validProdSecret);
  });

  await t.test('diagnoseMongoError correctly classifies DNS, network timeout, auth, and missing config', () => {
    const testUri = 'mongodb+srv://admin_user:super_secret_pw@cluster0.hvdajky.mongodb.net/realestate_crm';

    // 1. Missing config
    const missingDiag = diagnoseMongoError(new Error('MongoDB connection URI is missing'));
    assert.equal(missingDiag.category, 'MISSING_CONFIGURATION');

    // 2. DNS/SRV failure
    const dnsErr = new Error('querySrv ENOTFOUND _mongodb._tcp.cluster0.hvdajky.mongodb.net');
    dnsErr.code = 'ENOTFOUND';
    const dnsDiag = diagnoseMongoError(dnsErr, testUri);
    assert.equal(dnsDiag.category, 'DNS_SRV_RESOLUTION_FAILURE');
    assert.ok(dnsDiag.summary.includes('cluster0.hvdajky.mongodb.net'));
    assert.ok(!dnsDiag.summary.includes('super_secret_pw'));

    // 3. Authentication failure
    const authErr = new Error('bad auth : Authentication failed.');
    authErr.code = 8000;
    authErr.codeName = 'AtlasError';
    const authDiag = diagnoseMongoError(authErr, testUri);
    assert.equal(authDiag.category, 'AUTHENTICATION_FAILURE');
    assert.ok(authDiag.action.includes('Database Access'));

    // 4. Server Selection / IP whitelist timeout
    const timeoutErr = new Error('Could not connect to any servers in your MongoDB Atlas cluster.');
    timeoutErr.name = 'MongoServerSelectionError';
    const timeoutDiag = diagnoseMongoError(timeoutErr, testUri);
    assert.equal(timeoutDiag.category, 'SERVER_SELECTION_NETWORK_TIMEOUT');
    assert.ok(timeoutDiag.action.includes('0.0.0.0/0'));

    // 5. Credentials redaction
    const rawErrorWithCredentials = 'Failed to connect: mongodb+srv://najadahammed34_db_user:X65bNZc1U2BKfGw8@cluster0.hvdajky.mongodb.net/realestate_crm';
    const sanitized = sanitizeMongoError(rawErrorWithCredentials);
    assert.ok(!sanitized.includes('X65bNZc1U2BKfGw8'));
    assert.ok(!sanitized.includes('najadahammed34_db_user'));
  });

  await disconnectDB();

  await t.test('GET /api/health returns 503 when MongoDB is disconnected', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 503);
    assert.equal(res.body.status, 'unhealthy');
    assert.equal(res.body.database, 'disconnected');
  });
});

