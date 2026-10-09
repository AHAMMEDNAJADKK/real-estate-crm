import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Customer from '../../src/models/Customer.js';
import Opportunity from '../../src/models/Opportunity.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Integration Tests: Sales Pipeline & Opportunity Deal Flow', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_opportunities');

  // Setup test user
  await User.deleteMany({ email: 'sales_lead@kodbrand.com' });
  const salesExec = await User.create({
    name: 'Sales Lead',
    email: 'sales_lead@kodbrand.com',
    phone: '9876560001',
    password: 'Password@123',
    role: 'sales_executive'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sales_lead@kodbrand.com', password: 'Password@123' });
  const token = loginRes.body.data.token;

  // Setup test customer
  await Customer.deleteMany({ phone: '9876560002' });
  const customer = await Customer.create({
    name: 'Dr. Anand Varma',
    phone: '9876560002',
    email: 'anand.varma@hospital.com',
    customerType: 'Buyer',
    assignedAgent: salesExec._id
  });

  let createdOppId = '';

  await t.test('Sales Exec creates deal opportunity in Qualified stage', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Dr. Anand — 3BHK Corner Penthouse Inquiry',
        customer: customer._id,
        stage: 'Qualified',
        expectedRevenue: 18500000,
        probability: 30,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.stage, 'Qualified');
    assert.equal(res.body.data.expectedRevenue, 18500000);
    createdOppId = res.body.data._id;
  });

  await t.test('Advance opportunity stage to Negotiation and record offer', async () => {
    const res = await request(app)
      .patch(`/api/opportunities/${createdOppId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stage: 'Negotiation',
        probability: 75,
        nextAction: 'Finalize discount on parking slot'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.stage, 'Negotiation');
    assert.equal(res.body.data.probability, 75);
  });

  await t.test('Close deal as Won', async () => {
    const res = await request(app)
      .patch(`/api/opportunities/${createdOppId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stage: 'Closed Won',
        probability: 100
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.stage, 'Closed Won');
    assert.equal(res.body.data.probability, 100);
  });

  await t.test('Query sales pipeline returns opportunities list', async () => {
    const res = await request(app)
      .get('/api/opportunities')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 1);
  });

  await disconnectDB();
});
