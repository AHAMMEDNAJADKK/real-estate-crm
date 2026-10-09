import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Integration Tests: Authentication & Role-Based Access Control', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_rbac');

  // Setup test users
  await User.deleteMany({ email: { $in: ['admin_rbac@kodbrand.com', 'tele_rbac@kodbrand.com'] } });
  const admin = await User.create({
    name: 'RBAC Admin',
    email: 'admin_rbac@kodbrand.com',
    phone: '9876500001',
    password: 'Password@123',
    role: 'super_admin'
  });

  const telecaller = await User.create({
    name: 'RBAC Telecaller',
    email: 'tele_rbac@kodbrand.com',
    phone: '9876500002',
    password: 'Password@123',
    role: 'telecaller'
  });

  let adminToken = '';
  let telecallerToken = '';

  await t.test('Admin login succeeds and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin_rbac@kodbrand.com', password: 'Password@123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'super_admin');
    adminToken = res.body.data.token;
  });

  await t.test('Telecaller login succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tele_rbac@kodbrand.com', password: 'Password@123' });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);
    telecallerToken = res.body.data.token;
  });

  await t.test('Unauthenticated request to /api/leads is rejected with 401', async () => {
    const res = await request(app).get('/api/leads');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('Telecaller is blocked (403) from accessing admin audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${telecallerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('Admin is permitted (200) to access audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  await User.deleteMany({ email: { $in: ['admin_rbac@kodbrand.com', 'tele_rbac@kodbrand.com'] } });
  await disconnectDB();
});
