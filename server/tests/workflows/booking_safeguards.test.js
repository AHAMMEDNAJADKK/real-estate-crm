import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Project from '../../src/models/Project.js';
import Property from '../../src/models/Property.js';
import Customer from '../../src/models/Customer.js';
import Booking from '../../src/models/Booking.js';
import PaymentSchedule from '../../src/models/PaymentSchedule.js';
import Commission from '../../src/models/Commission.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Workflow Tests: Critical Booking Concurrency & Safeguards', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_booking_safeguards');

  // Setup roles
  await User.deleteMany({ email: { $in: ['admin_bk@kodbrand.com', 'exec_bk@kodbrand.com'] } });
  const admin = await User.create({
    name: 'Admin Safeguard',
    email: 'admin_bk@kodbrand.com',
    phone: '9870001111',
    password: 'Password@123',
    role: 'super_admin'
  });

  const salesExec = await User.create({
    name: 'Sales Exec',
    email: 'exec_bk@kodbrand.com',
    phone: '9870002222',
    password: 'Password@123',
    role: 'sales_executive'
  });

  const adminAuth = await request(app).post('/api/auth/login').send({ email: 'admin_bk@kodbrand.com', password: 'Password@123' });
  const execAuth = await request(app).post('/api/auth/login').send({ email: 'exec_bk@kodbrand.com', password: 'Password@123' });

  const adminToken = adminAuth.body.data.token;
  const execToken = execAuth.body.data.token;

  // Setup Project and Unit
  await Project.deleteMany({ code: 'SKY-VILLAS' });
  const project = await Project.create({
    name: 'Skyline Luxury Villas',
    code: 'SKY-VILLAS',
    developer: 'KODBRAND Realty',
    location: { city: 'Bangalore' }
  });

  await Property.deleteMany({ unitNumber: 'VILLA-101', project: project._id });
  const property = await Property.create({
    unitNumber: 'VILLA-101',
    project: project._id,
    superBuiltUpAreaSqFt: 3200,
    listedPrice: 25000000,
    status: 'Available'
  });

  await Customer.deleteMany({ phone: '9111222333' });
  const customer = await Customer.create({
    name: 'Vikram Malhotra',
    phone: '9111222333',
    email: 'vikram@example.com'
  });

  let bookingId = '';

  await t.test('Sales exec cannot give unapproved discount without manager/admin permissions', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${execToken}`)
      .send({
        customerId: customer._id,
        propertyId: property._id,
        discountAmount: 500000 // 5 Lakh discount
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes('discounts'));
  });

  await t.test('Admin reserves property unit and locks it atomically', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customer._id,
        propertyId: property._id,
        discountAmount: 200000,
        tokenAmount: 500000,
        remarks: 'Advance token accepted via bank transfer'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'Reserved');
    assert.equal(res.body.data.finalAgreedPrice, 24800000);
    bookingId = res.body.data._id || res.body.data.id;

    const lockedUnit = await Property.findById(property._id);
    assert.equal(lockedUnit.status, 'Reserved');
    assert.ok(lockedUnit.reservationExpiresAt);
  });

  await t.test('Concurrent booking safeguard: prevents another booking for already reserved unit', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customer._id,
        propertyId: property._id
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('not available'));
  });

  await t.test('Confirm booking enforces milestone payment schedule & commission generation', async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'Confirmed');

    // Unit is now officially Booked
    const bookedUnit = await Property.findById(property._id);
    assert.equal(bookedUnit.status, 'Booked');

    // Verify Payment Schedule exists with milestones
    const schedule = await PaymentSchedule.findOne({ booking: bookingId });
    assert.ok(schedule);
    assert.equal(schedule.installments.length, 6);
    assert.equal(schedule.totalAmount, 24800000);

    // Verify Commission record auto-created
    const comm = await Commission.findOne({ booking: bookingId });
    assert.ok(comm);
    assert.equal(comm.saleValue, 24800000);
    assert.equal(comm.commissionAmount, 248000); // 1%
  });

  await t.test('Cancelling booking releases property back to Available', async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Buyer loan rejected by bank' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'Cancelled');

    const releasedUnit = await Property.findById(property._id);
    assert.equal(releasedUnit.status, 'Available');
  });

  await Project.deleteMany({ code: 'SKY-VILLAS' });
  await Property.deleteMany({ unitNumber: 'VILLA-101' });
  await Customer.deleteMany({ phone: '9111222333' });
  await Booking.deleteMany({ _id: bookingId });
  await User.deleteMany({ email: { $in: ['admin_bk@kodbrand.com', 'exec_bk@kodbrand.com'] } });
  await disconnectDB();
});
