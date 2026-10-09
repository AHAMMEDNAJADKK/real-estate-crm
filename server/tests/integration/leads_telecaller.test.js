import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Lead from '../../src/models/Lead.js';
import CallLog from '../../src/models/CallLog.js';
import Customer from '../../src/models/Customer.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Integration Tests: Leads & Telecaller Workflow', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_leads');

  await User.deleteMany({ email: 'tele_lead_test@kodbrand.com' });
  const telecaller = await User.create({
    name: 'Priya Telecaller',
    email: 'tele_lead_test@kodbrand.com',
    phone: '9876540001',
    password: 'Password@123',
    role: 'telecaller'
  });

  const authRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tele_lead_test@kodbrand.com', password: 'Password@123' });
  const token = authRes.body.data.token;

  let leadId = '';
  const testPhone = '9988776655';

  await t.test('Create new Lead with Hot temperature and source', async () => {
    await Lead.deleteMany({ phone: testPhone });
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leadName: 'Rahul Sharma',
        phone: testPhone,
        email: 'rahul.sharma@example.com',
        city: 'Bangalore',
        source: 'Meta Ads',
        temperature: 'Hot',
        budgetMin: 7500000,
        budgetMax: 10000000,
        preferredLocation: 'Whitefield',
        preferredPropertyType: '3BHK'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.leadName, 'Rahul Sharma');
    assert.equal(res.body.data.temperature, 'Hot');
    leadId = res.body.data._id || res.body.data.id;
  });

  await t.test('Duplicate lead detection prevents creating lead with identical phone', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leadName: 'Rahul Sharma Duplicate',
        phone: testPhone,
        email: 'other@example.com'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('already exists'));
  });

  await t.test('Record call log and update temperature / schedule follow-up', async () => {
    const followUpDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/call-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leadId,
        callOutcome: 'Interested',
        temperature: 'Hot',
        notes: 'Client interested in 3BHK East-facing unit on higher floor',
        callDurationSeconds: 180,
        nextFollowUpDate: followUpDate
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.callOutcome, 'Interested');

    // Verify lead was updated
    const updatedLead = await Lead.findById(leadId);
    assert.equal(updatedLead.status, 'Contacted');
    assert.equal(updatedLead.temperature, 'Hot');
    assert.ok(updatedLead.nextFollowUpDate);
  });

  await t.test('Lead conversion creates and links 360 Customer profile', async () => {
    await Customer.deleteMany({ phone: testPhone });
    const res = await request(app)
      .patch(`/api/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'Converted',
        temperature: 'Hot',
        remarks: 'Client qualified and ready for property booking'
      });

    assert.equal(res.status, 200);
    const convertedLead = await Lead.findById(leadId);
    assert.equal(convertedLead.status, 'Converted');
    assert.ok(convertedLead.customer, 'Customer profile reference should be set');

    const createdCustomer = await Customer.findById(convertedLead.customer);
    assert.ok(createdCustomer);
    assert.equal(createdCustomer.name, 'Rahul Sharma');
    assert.equal(createdCustomer.phone, testPhone);
  });

  await Lead.deleteMany({ phone: testPhone });
  await Customer.deleteMany({ phone: testPhone });
  await User.deleteMany({ email: 'tele_lead_test@kodbrand.com' });
  await disconnectDB();
});
