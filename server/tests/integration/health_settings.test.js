import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

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
    assert.ok(res.body.timestamp);
    assert.ok(res.body.service);
  });

  await t.test('GET /api/health returns healthy status for API health monitors', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
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

  await disconnectDB();
});
