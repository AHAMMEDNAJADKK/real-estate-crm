import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Integration Tests: Authentication & Role-Based Access Control', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_rbac');

  // Setup test users
  await User.deleteMany({
    email: {
      $in: [
        'admin_rbac@kodbrand.com',
        'normal_admin_rbac@kodbrand.com',
        'tele_rbac@kodbrand.com',
        'superadmin@gmail.com'
      ]
    }
  });

  await User.create({
    name: 'RBAC Super Admin',
    email: 'admin_rbac@kodbrand.com',
    phone: '9876500001',
    password: 'Password@123',
    role: 'super_admin'
  });

  await User.create({
    name: 'RBAC Normal Admin',
    email: 'normal_admin_rbac@kodbrand.com',
    phone: '9876500003',
    password: 'Password@123',
    role: 'admin'
  });

  await User.create({
    name: 'RBAC Telecaller',
    email: 'tele_rbac@kodbrand.com',
    phone: '9876500002',
    password: 'Password@123',
    role: 'telecaller'
  });

  let adminToken = '';
  let normalAdminToken = '';
  let telecallerToken = '';
  let superAdminToken = '';

  await t.test('Seed initial Super Admin account idempotently with hashed password', async () => {
    await AuthService.seedInitialAdmin();
    const seeded = await User.findOne({ email: 'superadmin@gmail.com' }).select('+password');
    assert.ok(seeded, 'superadmin@gmail.com should exist after seeding');
    assert.equal(seeded.role, 'superadmin');
    assert.notEqual(seeded.password, 'superadmin@111', 'Password must be bcrypt-hashed, never plaintext');
    assert.ok(seeded.password.startsWith('$2'), 'Password hash should be a valid bcrypt hash');

    const originalHash = seeded.password;
    // Call seedInitialAdmin a second time to verify idempotency
    await AuthService.seedInitialAdmin();
    const count = await User.countDocuments({ email: 'superadmin@gmail.com' });
    assert.equal(count, 1, 'Should not create duplicate superadmin accounts');

    const afterSecondSeed = await User.findOne({ email: 'superadmin@gmail.com' }).select('+password');
    assert.equal(afterSecondSeed.password, originalHash, 'Should not overwrite existing password on restart');
  });

  await t.test('Super Admin login with superadmin@gmail.com / superadmin@111 succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@gmail.com', password: 'superadmin@111' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'superadmin@gmail.com');
    assert.equal(res.body.data.user.role, 'superadmin');
    superAdminToken = res.body.data.token;
  });

  await t.test('Login with wrong password fails with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@gmail.com', password: 'WrongPassword@999' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('Session restoration via GET /api/auth/me succeeds for authenticated Super Admin', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.email, 'superadmin@gmail.com');
    assert.equal(res.body.data.role, 'superadmin');
  });

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

  await t.test('Normal Admin (role: admin) login succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'normal_admin_rbac@kodbrand.com', password: 'Password@123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.role, 'admin');
    normalAdminToken = res.body.data.token;
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

  await t.test('Super Admin is permitted (200) to access /api/super-admin/overview and /api/super-admin/users', async () => {
    const overviewRes = await request(app)
      .get('/api/super-admin/overview')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(overviewRes.status, 200);
    assert.equal(overviewRes.body.success, true);
    assert.ok(overviewRes.body.data.userStats);
    assert.ok(overviewRes.body.data.systemHealth);

    const usersRes = await request(app)
      .get('/api/super-admin/users')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(usersRes.status, 200);
    assert.equal(usersRes.body.success, true);
    assert.ok(Array.isArray(usersRes.body.data));
  });

  await t.test('Login with unknown email address is rejected safely with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent_user_999@kodbrand.com', password: 'Password@123' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password credentials');
  });

  await t.test('Invalid or expired JWT token is rejected with 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.jwt.token');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('Normal Admin (role: admin) and Telecaller are blocked (403) from /api/super-admin/overview and cannot escalate role', async () => {
    const normalAdminRes = await request(app)
      .get('/api/super-admin/overview')
      .set('Authorization', `Bearer ${normalAdminToken}`);

    assert.equal(normalAdminRes.status, 403);
    assert.equal(normalAdminRes.body.success, false);

    // Normal admin attempting to create a superadmin user via /api/users is rejected
    const escalateRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${normalAdminToken}`)
      .send({
        name: 'Forged Super Admin',
        email: 'forged_sa@kodbrand.com',
        phone: '9876599999',
        password: 'Password@123',
        role: 'superadmin'
      });

    assert.equal(escalateRes.status, 400);
    assert.equal(escalateRes.body.success, false);

    const teleRes = await request(app)
      .get('/api/super-admin/overview')
      .set('Authorization', `Bearer ${telecallerToken}`);

    assert.equal(teleRes.status, 403);
    assert.equal(teleRes.body.success, false);
  });

  await User.deleteMany({
    email: {
      $in: [
        'admin_rbac@kodbrand.com',
        'normal_admin_rbac@kodbrand.com',
        'tele_rbac@kodbrand.com',
        'forged_sa@kodbrand.com'
      ]
    }
  });
  await disconnectDB();
});
