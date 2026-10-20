import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Lead from '../../src/models/Lead.js';
import FollowUp from '../../src/models/FollowUp.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Integration Tests: Follow-Ups Workflow & RBAC', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_followups');

  // Clean test accounts
  await User.deleteMany({ email: { $in: ['admin_fu_test@kodbrand.com', 'tele1_fu_test@kodbrand.com', 'tele2_fu_test@kodbrand.com'] } });
  await Lead.deleteMany({ phone: { $in: ['9100112233', '9100112244'] } });
  await FollowUp.deleteMany({});

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin_fu_test@kodbrand.com',
    phone: '9876540090',
    password: 'Password@123',
    role: 'admin'
  });

  const telecaller1 = await User.create({
    name: 'Telecaller One',
    email: 'tele1_fu_test@kodbrand.com',
    phone: '9876540091',
    password: 'Password@123',
    role: 'telecaller'
  });

  const telecaller2 = await User.create({
    name: 'Telecaller Two',
    email: 'tele2_fu_test@kodbrand.com',
    phone: '9876540092',
    password: 'Password@123',
    role: 'telecaller'
  });

  const adminAuth = await request(app).post('/api/auth/login').send({ email: 'admin_fu_test@kodbrand.com', password: 'Password@123' });
  const adminToken = adminAuth.body.data.token;

  const tele1Auth = await request(app).post('/api/auth/login').send({ email: 'tele1_fu_test@kodbrand.com', password: 'Password@123' });
  const tele1Token = tele1Auth.body.data.token;

  const tele2Auth = await request(app).post('/api/auth/login').send({ email: 'tele2_fu_test@kodbrand.com', password: 'Password@123' });
  const tele2Token = tele2Auth.body.data.token;

  // Create a test lead
  const lead1 = await Lead.create({
    leadName: 'Vikram Malhotra',
    phone: '9100112233',
    email: 'vikram.m@example.com',
    city: 'Mumbai',
    source: 'Website',
    temperature: 'Warm',
    assignedTo: telecaller1._id,
    createdBy: admin._id
  });

  let followUpId = '';

  await t.test('Schedule new follow-up and verify lead nextFollowUpDate synchronization', async () => {
    const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
    const res = await request(app)
      .post('/api/follow-ups')
      .set('Authorization', `Bearer ${tele1Token}`)
      .send({
        leadId: lead1._id.toString(),
        scheduledDate,
        priority: 'High',
        notes: 'Discussion about 3BHK sea view options'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.priority, 'High');
    assert.equal(res.body.data.status, 'Pending');
    followUpId = res.body.data.id || res.body.data._id;

    // Verify lead was updated
    const updatedLead = await Lead.findById(lead1._id);
    assert.ok(updatedLead.nextFollowUpDate);
    assert.equal(new Date(updatedLead.nextFollowUpDate).toISOString(), new Date(scheduledDate).toISOString());
  });

  await t.test('Fetch follow-up list via /api/follow-ups with search, filter, and pagination', async () => {
    const res = await request(app)
      .get('/api/follow-ups?search=Vikram&timeframe=all')
      .set('Authorization', `Bearer ${tele1Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].lead.leadName, 'Vikram Malhotra');
    assert.equal(res.body.pagination.totalRecords, 1);
  });

  await t.test('Enforce RBAC scoping: Telecaller cannot see follow-up assigned to another telecaller', async () => {
    // telecaller2 requests follow-ups
    const res = await request(app)
      .get('/api/follow-ups')
      .set('Authorization', `Bearer ${tele2Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 0); // telecaller2 has no assigned follow-ups
  });

  await t.test('Admin is authorized to view all follow-ups and filter by employee', async () => {
    const res = await request(app)
      .get(`/api/follow-ups?assignedTo=${telecaller1._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
  });

  await t.test('Fetch single follow-up details by ID', async () => {
    const res = await request(app)
      .get(`/api/follow-ups/${followUpId}`)
      .set('Authorization', `Bearer ${tele1Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.notes, 'Discussion about 3BHK sea view options');
  });

  await t.test('Telecaller cannot access single follow-up assigned to someone else', async () => {
    const res = await request(app)
      .get(`/api/follow-ups/${followUpId}`)
      .set('Authorization', `Bearer ${tele2Token}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('Reschedule follow-up to future date', async () => {
    const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .put(`/api/follow-ups/${followUpId}`)
      .set('Authorization', `Bearer ${tele1Token}`)
      .send({
        scheduledDate: newDate,
        status: 'Rescheduled',
        notes: 'Client requested reschedule to day after tomorrow'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'Rescheduled');

    const updatedLead = await Lead.findById(lead1._id);
    assert.equal(new Date(updatedLead.nextFollowUpDate).toISOString(), new Date(newDate).toISOString());
  });

  await t.test('Mark follow-up as Completed with outcome notes', async () => {
    const res = await request(app)
      .put(`/api/follow-ups/${followUpId}`)
      .set('Authorization', `Bearer ${tele1Token}`)
      .send({
        status: 'Completed',
        outcome: 'Client confirmed site visit scheduled for weekend'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'Completed');
    assert.ok(res.body.data.completedAt);
    assert.equal(res.body.data.outcome, 'Client confirmed site visit scheduled for weekend');

    // Because this was the only pending follow-up, lead.nextFollowUpDate should now be null
    const updatedLead = await Lead.findById(lead1._id);
    assert.equal(updatedLead.nextFollowUpDate, null);
  });

  await t.test('Cancel a follow-up', async () => {
    // Create another follow-up first
    const fu2Res = await request(app)
      .post('/api/follow-ups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        leadId: lead1._id.toString(),
        scheduledDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        assignedTo: telecaller1._id.toString(),
        notes: 'Second call to be cancelled'
      });

    const fu2Id = fu2Res.body.data.id || fu2Res.body.data._id;

    const res = await request(app)
      .put(`/api/follow-ups/${fu2Id}`)
      .set('Authorization', `Bearer ${tele1Token}`)
      .send({
        status: 'Cancelled',
        notes: 'Lead requested no further calls'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'Cancelled');
  });

  await t.test('Delete follow-up as Admin', async () => {
    const res = await request(app)
      .delete(`/api/follow-ups/${followUpId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const check = await FollowUp.findById(followUpId);
    assert.equal(check, null);
  });

  await disconnectDB();
});
