import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';
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
    assert.throws(() => validateJwtSecret('', { nodeEnv: 'production' }), /missing/i);
    assert.throws(
      () => validateJwtSecret('kodbrand_enterprise_crm_jwt_super_secret_key_2026_realestate', { nodeEnv: 'production' }),
      /strong, unique JWT_SECRET/i
    );
  });

  await disconnectDB();

  await t.test('GET /api/health returns 503 when MongoDB is disconnected', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 503);
    assert.equal(res.body.status, 'unhealthy');
    assert.equal(res.body.database, 'disconnected');
  });
});

