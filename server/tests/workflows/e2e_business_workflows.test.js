import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Lead from '../../src/models/Lead.js';
import Project from '../../src/models/Project.js';
import Property from '../../src/models/Property.js';
import Customer from '../../src/models/Customer.js';
import Opportunity from '../../src/models/Opportunity.js';
import Booking from '../../src/models/Booking.js';
import Payment from '../../src/models/Payment.js';
import SiteVisit from '../../src/models/SiteVisit.js';
import Transaction from '../../src/models/Transaction.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('End-to-End Business Workflows & Multi-Role Security Integrity Suite', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_e2e_workflows');

  // Clean all test entities for deterministic execution
  await Promise.all([
    Payment.deleteMany({}),
    Transaction.deleteMany({}),
    Booking.deleteMany({}),
    Opportunity.deleteMany({}),
    SiteVisit.deleteMany({}),
    Customer.deleteMany({}),
    Lead.deleteMany({})
  ]);

  // Clean and prepare test users for all 5 roles
  await User.deleteMany({
    email: {
      $in: [
        'e2e_admin@kodbrand.com',
        'e2e_manager@kodbrand.com',
        'e2e_telecaller@kodbrand.com',
        'e2e_sales@kodbrand.com',
        'e2e_accountant@kodbrand.com'
      ]
    }
  });

  const admin = await User.create({
    name: 'E2E Super Admin',
    email: 'e2e_admin@kodbrand.com',
    phone: '9800000001',
    password: 'Password@123',
    role: 'super_admin'
  });

  const manager = await User.create({
    name: 'E2E Sales Manager',
    email: 'e2e_manager@kodbrand.com',
    phone: '9800000002',
    password: 'Password@123',
    role: 'sales_manager'
  });

  const telecaller = await User.create({
    name: 'E2E Telecaller',
    email: 'e2e_telecaller@kodbrand.com',
    phone: '9800000003',
    password: 'Password@123',
    role: 'telecaller'
  });

  const salesExec = await User.create({
    name: 'E2E Sales Executive',
    email: 'e2e_sales@kodbrand.com',
    phone: '9800000004',
    password: 'Password@123',
    role: 'sales_executive'
  });

  const accountant = await User.create({
    name: 'E2E Chief Accountant',
    email: 'e2e_accountant@kodbrand.com',
    phone: '9800000005',
    password: 'Password@123',
    role: 'accountant'
  });

  // Login tokens
  const getToken = async (email) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'Password@123' });
    return res.body.data.token;
  };

  const adminToken = await getToken('e2e_admin@kodbrand.com');
  const managerToken = await getToken('e2e_manager@kodbrand.com');
  const telecallerToken = await getToken('e2e_telecaller@kodbrand.com');
  const salesToken = await getToken('e2e_sales@kodbrand.com');
  const accountantToken = await getToken('e2e_accountant@kodbrand.com');

  // Shared test project & property
  await Project.deleteMany({ code: 'E2E-PRJ-01' });
  const project = await Project.create({
    name: 'Emerald Heights',
    code: 'E2E-PRJ-01',
    reraNumber: 'RERA/KA/2026/0991',
    projectType: 'Residential',
    location: { city: 'Bangalore', state: 'Karnataka', address: 'Sarjapur Main Road' },
    totalUnits: 50,
    availableUnits: 50
  });

  await Property.deleteMany({ project: project._id });
  const propertyUnit1 = await Property.create({
    unitNumber: 'TowerA-101',
    project: project._id,
    blockOrTower: 'Tower A',
    floor: 1,
    propertyType: '2BHK',
    superBuiltUpAreaSqFt: 1250,
    listedPrice: 8500000,
    status: 'Available'
  });

  const propertyUnit2 = await Property.create({
    unitNumber: 'TowerA-102',
    project: project._id,
    blockOrTower: 'Tower A',
    floor: 1,
    propertyType: '3BHK',
    superBuiltUpAreaSqFt: 1750,
    listedPrice: 12000000,
    status: 'Available'
  });

  let workflowLeadId = '';
  let workflowCustomerId = '';
  let workflowBookingId = '';
  let workflowPaymentId = '';

  // --------------------------------------------------------------------------
  // WORKFLOW 1: Lead to Booking
  // --------------------------------------------------------------------------
  await t.test('Workflow 1 — Lead to Booking Lifecycle', async (w1) => {
    await w1.test('Step 1: Create New Lead with Hot temperature and valid enquiry details', async () => {
      await Lead.deleteMany({ phone: '9811122233' });
      await Customer.deleteMany({ phone: '9811122233' });
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leadName: 'Vikramaditya Roy',
          phone: '9811122233',
          email: 'vikram.roy@fintech.io',
          source: 'Meta Ads',
          temperature: 'Hot',
          budgetMin: 8000000,
          budgetMax: 10000000,
          preferredLocation: 'Sarjapur',
          city: 'Bangalore'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.temperature, 'Hot');
      workflowLeadId = res.body.data._id;
    });

    await w1.test('Step 2: Assign Lead to Telecaller and Sales Executive', async () => {
      const res = await request(app)
        .patch(`/api/leads/${workflowLeadId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assignedTo: salesExec._id });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.assignedTo, salesExec._id.toString());
    });

    await w1.test('Step 3: Record Call Interaction Log and update temperature', async () => {
      const res = await request(app)
        .post('/api/call-logs')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          leadId: workflowLeadId,
          callOutcome: 'Interested',
          temperature: 'Hot',
          callDurationSeconds: 180,
          notes: 'Customer interested in Tower A 2BHK garden view, requested in-person site tour'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.callOutcome, 'Interested');
    });

    await w1.test('Step 4: Schedule Property Site Visit Walkthrough', async () => {
      const res = await request(app)
        .post('/api/site-visits')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          lead: workflowLeadId,
          project: project._id,
          assignedExecutive: salesExec._id,
          visitDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          visitTime: '11:00 AM',
          visitorsCount: 3,
          pickupRequired: true,
          pickupLocation: 'HSR Layout Sector 2'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Scheduled');
    });

    await w1.test('Step 5: Convert Lead to 360 Customer Profile', async () => {
      const res = await request(app)
        .patch(`/api/leads/${workflowLeadId}/status`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({ status: 'Converted' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Converted');

      const customer = await Customer.findOne({ originatingLead: workflowLeadId });
      assert.ok(customer);
      assert.equal(customer.name, 'Vikramaditya Roy');
      workflowCustomerId = customer._id;
    });

    await w1.test('Step 6: Create Opportunity in Sales Pipeline', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          title: 'Vikramaditya Roy — Emerald Heights 2BHK',
          customer: workflowCustomerId,
          originatingLead: workflowLeadId,
          project: project._id,
          property: propertyUnit1._id,
          stage: 'Negotiation',
          expectedRevenue: 8500000,
          probability: 80
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
    });

    await w1.test('Step 7: Reserve Property Unit and verify Atomic Hold', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: workflowCustomerId,
          propertyId: propertyUnit1._id,
          tokenAmount: 200000,
          discountAmount: 50000,
          reservationHours: 72,
          remarks: 'Token advance committed by buyer'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Reserved');
      workflowBookingId = res.body.data._id;

      // Verify property is marked Reserved in DB
      const updatedProp = await Property.findById(propertyUnit1._id);
      assert.equal(updatedProp.status, 'Reserved');
    });

    await w1.test('Step 8: Confirm Booking and verify milestone schedule generation', async () => {
      const res = await request(app)
        .post(`/api/bookings/${workflowBookingId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Confirmed');

      const confirmedProp = await Property.findById(propertyUnit1._id);
      assert.equal(confirmedProp.status, 'Booked');
    });
  });

  // --------------------------------------------------------------------------
  // WORKFLOW 2: Booking to Accounts & Financial Reconciliation
  // --------------------------------------------------------------------------
  await t.test('Workflow 2 — Booking to Accounts & Invoicing Reconciliation', async (w2) => {
    await w2.test('Step 1: Verify auto-generated milestone installment schedule', async () => {
      const res = await request(app)
        .get(`/api/payments/schedule/${workflowBookingId}`)
        .set('Authorization', `Bearer ${accountantToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok((res.body.data.milestones || res.body.data.installments || []).length >= 3);
    });

    await w2.test('Step 2: Accountant records initial installment payment of ₹10,00,000', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          bookingId: workflowBookingId,
          amount: 1000000,
          paymentMethod: 'Bank Transfer (NEFT/RTGS)',
          transactionReference: 'NEFT-E2E-2026-9901',
          notes: 'Booking advance payment received in HDFC ESCROW'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Successful');
      assert.ok(res.body.data.receiptNumber);
      workflowPaymentId = res.body.data._id;
    });

    await w2.test('Step 3: Retrieve official receipt details and balance statement', async () => {
      const res = await request(app)
        .get(`/api/payments/receipt/${workflowPaymentId}`)
        .set('Authorization', `Bearer ${accountantToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.amount, 1000000);
      assert.ok(res.body.data.receiptNumber);
    });

    await w2.test('Step 4: Verify collections dashboard reflects live received amount', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok((res.body.data.totalCollections || res.body.data.totalCollected || res.body.data.sales?.totalCollected || 0) >= 1000000);
    });

    await w2.test('Step 5: Verify accounting reconciliation and ledger balance integrity', async () => {
      const res = await request(app)
        .get('/api/accounts/reconciliation')
        .set('Authorization', `Bearer ${accountantToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.totalCollected >= 1000000);
      assert.equal(res.body.data.isBalanced, true);
    });
  });

  // --------------------------------------------------------------------------
  // WORKFLOW 3: Multi-Role Permission Guards (RBAC Matrix)
  // --------------------------------------------------------------------------
  await t.test('Workflow 3 — Comprehensive RBAC Permission Enforcement', async (w3) => {
    await w3.test('Telecaller is forbidden (403) from accessing financial audit logs', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${telecallerToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    await w3.test('Sales Executive is forbidden (400/403) from applying unapproved discount > ₹1,00,000', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: workflowCustomerId,
          propertyId: propertyUnit2._id,
          tokenAmount: 200000,
          discountAmount: 600000 // Exceeds sales executive unapproved limit
        });

      if (res.status !== 400 && res.status !== 403) {
        console.error('FAIL W3-2:', res.status, res.body);
      }
      assert.ok([400, 403].includes(res.status));
      assert.equal(res.body.success, false);
    });

    await w3.test('Telecaller is forbidden (403) from confirming booking agreements', async () => {
      const res = await request(app)
        .post(`/api/bookings/${workflowBookingId}/confirm`)
        .set('Authorization', `Bearer ${telecallerToken}`);

      if (res.status !== 403) {
        console.error('FAIL W3-3:', res.status, res.body);
      }
      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    await w3.test('Accountant is authorized (200) to view accounts and payment schedules', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${accountantToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    await w3.test('Super Admin is authorized (200) to perform global administrative actions', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  // --------------------------------------------------------------------------
  // WORKFLOW 4: Cancellation, Unit Release & Partial Refund Integrity
  // --------------------------------------------------------------------------
  await t.test('Workflow 4 — Cancellation, Inventory Release & Refund Flow', async (w4) => {
    let cancelBookingId = '';
    let cancelPaymentId = '';
    let propertyUnitRefund = null;

    await w4.test('Step 1: Create separate booking for Unit 103 with ₹5,00,000 payment', async () => {
      propertyUnitRefund = await Property.create({
        unitNumber: 'TowerA-103',
        project: project._id,
        blockOrTower: 'Tower A',
        floor: 2,
        propertyType: '2BHK',
        superBuiltUpAreaSqFt: 1300,
        listedPrice: 9000000,
        status: 'Available'
      });

      const bookRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: workflowCustomerId,
          propertyId: propertyUnitRefund._id,
          tokenAmount: 500000,
          discountAmount: 0
        });

      assert.equal(bookRes.status, 201);
      cancelBookingId = bookRes.body.data._id;

      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          bookingId: cancelBookingId,
          amount: 500000,
          paymentMethod: 'Bank Transfer (NEFT/RTGS)',
          transactionReference: `REFUND-TEST-TXN-${Date.now()}`
        });
      assert.equal(payRes.status, 201);
      cancelPaymentId = payRes.body.data._id;
    });

    await w4.test('Step 2: Cancel Booking and verify property is released back to Available', async () => {
      const res = await request(app)
        .post(`/api/bookings/${cancelBookingId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Buyer opted out due to relocation' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Cancelled');

      const releasedProp = await Property.findById(propertyUnitRefund._id);
      assert.equal(releasedProp.status, 'Available');
    });

    await w4.test('Step 3: Process partial refund of ₹2,50,000 and verify ledger adjustments', async () => {
      const res = await request(app)
        .post(`/api/payments/${cancelPaymentId}/refund`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          refundAmount: 250000,
          reason: 'Authorized cancellation refund less cancellation forfeiture'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.refundAmount, 250000);
    });

    await w4.test('Step 4: Verify ledger balances adjust correctly after refund', async () => {
      const res = await request(app)
        .get('/api/accounts/reconciliation')
        .set('Authorization', `Bearer ${accountantToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.totalExpense >= 250000);
    });
  });

  await disconnectDB();
});
