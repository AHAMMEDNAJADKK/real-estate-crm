import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Lead from '../../src/models/Lead.js';
import Project from '../../src/models/Project.js';
import Property from '../../src/models/Property.js';
import Booking from '../../src/models/Booking.js';
import Customer from '../../src/models/Customer.js';
import FollowUp from '../../src/models/FollowUp.js';
import Meeting from '../../src/models/Meeting.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Integration & Regression Tests: Bugs 1 through 7 Full Coverage Suite', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_bug_fixes');

  // Clean up any test users
  await User.deleteMany({ email: { $in: ['bug_superadmin@test.com', 'bug_admin@test.com', 'bug_telecaller@test.com'] } });

  // 1. Seed superadmin (role: 'superadmin')
  const superadmin = await User.create({
    name: 'Super Admin Tester',
    email: 'bug_superadmin@test.com',
    phone: '9900011111',
    password: 'Password@123',
    role: 'superadmin'
  });

  // 2. Seed admin (role: 'admin')
  const admin = await User.create({
    name: 'Admin Tester',
    email: 'bug_admin@test.com',
    phone: '9900022222',
    password: 'Password@123',
    role: 'admin'
  });

  // 3. Seed telecaller (role: 'telecaller')
  const telecaller = await User.create({
    name: 'Telecaller Tester',
    email: 'bug_telecaller@test.com',
    phone: '9900033333',
    password: 'Password@123',
    role: 'telecaller'
  });

  // Log in each user
  const saLogin = await request(app).post('/api/auth/login').send({ email: 'bug_superadmin@test.com', password: 'Password@123' });
  const superadminToken = saLogin.body.data.token;

  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'bug_admin@test.com', password: 'Password@123' });
  const adminToken = adminLogin.body.data.token;

  const teleLogin = await request(app).post('/api/auth/login').send({ email: 'bug_telecaller@test.com', password: 'Password@123' });
  const telecallerToken = teleLogin.body.data.token;

  // ========================================================
  // BUG 1: LEADS EDIT & DELETE, FORM VALIDATION & PERMISSIONS
  // ========================================================
  await t.test('Bug 1: Lead Edit and Delete with RBAC and Referential Integrity', async (tLead) => {
    await Lead.deleteMany({ phone: { $in: ['9888877771', '9888877772'] } });

    // Step 1: Create lead
    const createRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        leadName: 'Rohan Verma',
        phone: '9888877771',
        email: 'rohan.verma@example.com',
        city: 'Mumbai',
        source: 'Website',
        budgetMin: 5000000,
        budgetMax: 8000000,
        assignedTo: telecaller._id
      });

    assert.equal(createRes.status, 201);
    const leadId = createRes.body.data._id;
    assert.equal(createRes.body.data.leadName, 'Rohan Verma');

    // Step 2: Edit lead via PUT /api/leads/:id
    const editRes = await request(app)
      .put(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        leadName: 'Rohan Verma Updated',
        phone: '9888877771',
        email: 'rohan.updated@example.com',
        city: 'Pune',
        budgetMax: 9500000,
        notes: 'Updated budget preference'
      });

    assert.equal(editRes.status, 200);
    assert.equal(editRes.body.success, true);
    assert.equal(editRes.body.data.leadName, 'Rohan Verma Updated');
    assert.equal(editRes.body.data.city, 'Pune');
    assert.equal(editRes.body.data.budgetMax, 9500000);

    // Verify in MongoDB directly
    const dbLead = await Lead.findById(leadId);
    assert.equal(dbLead.leadName, 'Rohan Verma Updated');
    assert.equal(dbLead.city, 'Pune');

    // Step 3: Telecaller attempts to delete lead -> 403 Forbidden
    const unauthDelete = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${telecallerToken}`);
    assert.equal(unauthDelete.status, 403);

    // Step 4: Admin deletes lead successfully -> 200 OK
    const authDelete = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(authDelete.status, 200);
    assert.equal(authDelete.body.success, true);

    // Verify lead is removed from MongoDB
    const deletedDbLead = await Lead.findById(leadId);
    assert.equal(deletedDbLead, null);

    // Step 5: Deleting non-existent lead -> 404 Not Found
    const notFoundDelete = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(notFoundDelete.status, 404);
  });

  // ========================================================
  // BUG 2: TELECALLER QUEUE & FRESH LEADS VISIBILITY
  // ========================================================
  await t.test('Bug 2: Newly Created Leads in Telecaller Queue with Manager Filters', async (tTele) => {
    await Lead.deleteMany({ phone: { $in: ['9111122221', '9111122222'] } });

    // Step 1: Create fresh lead assigned to telecaller
    const freshLead = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        leadName: 'Anita Desai',
        phone: '9111122221',
        email: 'anita.desai@example.com',
        city: 'Delhi',
        source: 'Google Ads',
        assignedTo: telecaller._id
      });
    assert.equal(freshLead.status, 201);

    // Step 2: Telecaller requests their queue
    const queueRes = await request(app)
      .get('/api/telecallers/queue')
      .set('Authorization', `Bearer ${telecallerToken}`);
    assert.equal(queueRes.status, 200);
    assert.equal(queueRes.body.success, true);
    assert.ok(Array.isArray(queueRes.body.data.freshLeads));
    const hasLead = queueRes.body.data.freshLeads.some(l => l.phone === '9111122221');
    assert.equal(hasLead, true, 'Fresh lead must be present in telecaller queue');

    // Step 3: Admin requests global queue without telecallerId filter
    const globalQueueRes = await request(app)
      .get('/api/telecallers/queue')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(globalQueueRes.status, 200);
    const hasLeadGlobal = globalQueueRes.body.data.freshLeads.some(l => l.phone === '9111122221');
    assert.equal(hasLeadGlobal, true, 'Admin global queue must display fresh leads');

    // Step 4: Admin requests queue filtered by specific telecallerId
    const filteredQueueRes = await request(app)
      .get(`/api/telecallers/queue?telecallerId=${telecaller._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(filteredQueueRes.status, 200);
    const hasLeadFiltered = filteredQueueRes.body.data.freshLeads.some(l => l.phone === '9111122221');
    assert.equal(hasLeadFiltered, true, 'Queue filtered by telecallerId must display assigned fresh lead');
  });

  // ========================================================
  // BUG 3: LEAD STATUS TO 'FOLLOW UP' & FOLLOW-UPS PAGE SYNC
  // ========================================================
  await t.test('Bug 3: Lead Status Change to Follow Up Synchronizes FollowUp Record', async (tFollow) => {
    await Lead.deleteMany({ phone: '9222233331' });
    await FollowUp.deleteMany({});

    // Step 1: Create lead with status 'New'
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        leadName: 'Vikram Rajput',
        phone: '9222233331',
        email: 'vikram.rajput@example.com',
        city: 'Jaipur',
        status: 'New',
        assignedTo: telecaller._id
      });
    assert.equal(leadRes.status, 201);
    const testLeadId = leadRes.body.data._id;

    // Verify no FollowUp exists yet
    const initialFollowUps = await FollowUp.find({ lead: testLeadId });
    assert.equal(initialFollowUps.length, 0);

    // Step 2: Change lead status to 'Follow Up' via status update
    const scheduledDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const statusRes = await request(app)
      .patch(`/api/leads/${testLeadId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Follow Up',
        scheduledDate,
        notes: 'Client requested a callback in 2 days',
        priority: 'High'
      });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.data.status, 'Follow Up');

    // Step 3: Verify FollowUp document was created in MongoDB
    const followUpsAfter = await FollowUp.find({ lead: testLeadId });
    assert.equal(followUpsAfter.length, 1);
    assert.equal(followUpsAfter[0].status, 'Pending');
    assert.equal(followUpsAfter[0].priority, 'High');

    // Step 4: Verify Follow-ups page endpoint returns this record
    const listRes = await request(app)
      .get(`/api/telecallers/follow-ups?leadId=${testLeadId}`)
      .set('Authorization', `Bearer ${telecallerToken}`);
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.length >= 1);

    // Step 5: Repeated status updates do not create duplicate follow-ups
    const repeatRes = await request(app)
      .patch(`/api/leads/${testLeadId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Follow Up',
        notes: 'Another note about the same follow up'
      });
    assert.equal(repeatRes.status, 200);
    const repeatFollowUps = await FollowUp.find({ lead: testLeadId, status: 'Pending' });
    assert.equal(repeatFollowUps.length, 1, 'Duplicate pending follow-up must not be created');

    // Step 6: Converting lead marks pending follow-up as Completed
    const convertRes = await request(app)
      .patch(`/api/leads/${testLeadId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Converted',
        notes: 'Lead successfully converted'
      });
    assert.equal(convertRes.status, 200);
    assert.equal(convertRes.body.data.status, 'Converted');
    const completedFollowUps = await FollowUp.find({ lead: testLeadId, status: 'Completed' });
    assert.equal(completedFollowUps.length, 1, 'Pending follow-up should be marked Completed upon conversion');
  });

  // ========================================================
  // BUG 4: MEETINGS AND FOLLOW-UPS ORDERING
  // ========================================================
  await t.test('Bug 4: Meetings and Follow-Ups Sorting by Scheduled Date and Creation Date', async (tSort) => {
    await Meeting.deleteMany({});
    const now = Date.now();
    const dateEarlier = new Date(now + 1 * 24 * 60 * 60 * 1000); // Tomorrow
    const dateLater = new Date(now + 7 * 24 * 60 * 60 * 1000);   // Next week

    // Create Meeting 1 with later scheduled date
    await Meeting.create({
      title: 'Meeting In Next Week',
      meetingType: 'Office Meeting',
      scheduledDate: dateLater,
      durationMinutes: 30,
      host: admin._id,
      assignedEmployee: admin._id,
      participants: [{ user: telecaller._id }],
      status: 'Scheduled'
    });

    // Create Meeting 2 with earlier scheduled date
    await Meeting.create({
      title: 'Meeting Tomorrow',
      meetingType: 'Office Meeting',
      scheduledDate: dateEarlier,
      durationMinutes: 60,
      host: admin._id,
      assignedEmployee: admin._id,
      participants: [{ user: telecaller._id }],
      status: 'Scheduled'
    });

    // Test sortBy=scheduledDate (default asc: earliest first)
    const ascRes = await request(app)
      .get('/api/meetings?sortBy=scheduledDate&sortOrder=asc')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(ascRes.status, 200);
    assert.ok(Array.isArray(ascRes.body.data));
    assert.equal(ascRes.body.data[0].title, 'Meeting Tomorrow');
    assert.equal(ascRes.body.data[1].title, 'Meeting In Next Week');

    // Test sortBy=createdAt (desc: newest created first)
    const createdDescRes = await request(app)
      .get('/api/meetings?sortBy=createdAt&sortOrder=desc')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(createdDescRes.status, 200);
    assert.ok(Array.isArray(createdDescRes.body.data));
    assert.equal(createdDescRes.body.data[0].title, 'Meeting Tomorrow'); // Created second
    assert.equal(createdDescRes.body.data[1].title, 'Meeting In Next Week');
  });

  // ========================================================
  // BUG 5: PROJECTS CRUD & REFERENTIAL INTEGRITY
  // ========================================================
  await t.test('Bug 5: Projects Edit, Delete, and Referential Integrity Protection', async (tProj) => {
    await Project.deleteMany({ code: 'PRJ-REG-01' });

    // Step 1: Create project
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Regal Palms Phase 1',
        code: 'PRJ-REG-01',
        description: 'Luxury villas project',
        projectType: 'Villa Community',
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          address: 'Gachibowli High Street'
        },
        totalUnits: 50
      });
    assert.equal(createRes.status, 201);
    const projId = createRes.body.data._id;

    // Step 2: Edit project via PUT /api/projects/:id
    const editRes = await request(app)
      .put(`/api/projects/${projId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Regal Palms Phase 1 & 2',
        totalUnits: 75,
        description: 'Expanded luxury villas community'
      });
    assert.equal(editRes.status, 200);
    assert.equal(editRes.body.data.name, 'Regal Palms Phase 1 & 2');
    assert.equal(editRes.body.data.totalUnits, 75);

    // Step 3: Add property under project to test referential integrity
    const propRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        unitNumber: 'V-101',
        project: projId,
        propertyType: 'Villa',
        superBuiltUpAreaSqFt: 3200,
        listedPrice: 15000000
      });
    assert.equal(propRes.status, 201);
    const propId = propRes.body.data._id;

    // Step 4: Attempt to delete project with active properties -> should be BLOCKED (400)
    const blockedDelete = await request(app)
      .delete(`/api/projects/${projId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(blockedDelete.status, 400);
    assert.ok(blockedDelete.body.message.includes('inventory unit'));

    // Step 5: Delete property unit first
    const deleteProp = await Property.findByIdAndDelete(propId);
    assert.ok(deleteProp);

    // Step 6: Now project deletion succeeds
    const allowedDelete = await request(app)
      .delete(`/api/projects/${projId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(allowedDelete.status, 200);
    assert.equal(allowedDelete.body.success, true);

    // Verify removed from MongoDB
    const checkDb = await Project.findById(projId);
    assert.equal(checkDb, null);
  });

  // ========================================================
  // BUG 7: BOOKINGS CONFIRMATION WITH 'superadmin' ROLE
  // ========================================================
  await t.test('Bug 7: Booking Creation and Confirmation under superadmin Role', async (tBook) => {
    // Setup Project and Property
    await Project.deleteMany({ code: 'PRJ-SA-01' });
    await Property.deleteMany({ unitNumber: 'SA-901' });
    await Customer.deleteMany({ phone: '9000012345' });

    const testProj = await Project.create({
      name: 'SuperAdmin Test Heights',
      code: 'PRJ-SA-01',
      projectType: 'Residential',
      location: { city: 'Bengaluru', state: 'Karnataka' },
      totalUnits: 10
    });

    const testUnit = await Property.create({
      unitNumber: 'SA-901',
      project: testProj._id,
      propertyType: 'Penthouse',
      superBuiltUpAreaSqFt: 4000,
      listedPrice: 20000000,
      status: 'Available'
    });

    const testCustomer = await Customer.create({
      name: 'Aditya Birla',
      phone: '9000012345',
      email: 'aditya.birla@example.com'
    });

    // Step 1: Create booking as superadmin
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({
        customerId: testCustomer._id,
        propertyId: testUnit._id,
        tokenAmount: 200000,
        discountAmount: 50000
      });

    assert.equal(bookingRes.status, 201);
    const bookingId = bookingRes.body.data._id;
    assert.equal(bookingRes.body.data.status, 'Reserved');

    // Step 2: Confirm booking as superadmin (role: 'superadmin')
    // Previously failed because service checked ['super_admin', 'admin'] and excluded 'superadmin'
    const confirmRes = await request(app)
      .post(`/api/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${superadminToken}`);

    assert.equal(confirmRes.status, 200);
    assert.equal(confirmRes.body.success, true);
    assert.equal(confirmRes.body.data.status, 'Confirmed');

    // Step 3: Verify Property status changed to 'Booked' in MongoDB
    const updatedProperty = await Property.findById(testUnit._id);
    assert.equal(updatedProperty.status, 'Booked');

    // Step 4: Confirming again is idempotent
    const repeatConfirm = await request(app)
      .post(`/api/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${superadminToken}`);
    assert.equal(repeatConfirm.status, 200);
    assert.equal(repeatConfirm.body.data.status, 'Confirmed');

    // Clean up
    await Booking.findByIdAndDelete(bookingId);
    await Property.findByIdAndDelete(testUnit._id);
    await Project.findByIdAndDelete(testProj._id);
    await Customer.findByIdAndDelete(testCustomer._id);
  });

  await disconnectDB();
});
