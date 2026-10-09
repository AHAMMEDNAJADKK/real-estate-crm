import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Project from '../../src/models/Project.js';
import Property from '../../src/models/Property.js';
import Customer from '../../src/models/Customer.js';
import Booking from '../../src/models/Booking.js';
import Payment from '../../src/models/Payment.js';
import Receipt from '../../src/models/Receipt.js';
import PaymentSchedule from '../../src/models/PaymentSchedule.js';
import Transaction from '../../src/models/Transaction.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Workflow Tests: Payments, Receipts, Balances & Accounting Reconciliation', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_payments');

  // Setup accountant user
  await User.deleteMany({ email: 'accountant_wf@kodbrand.com' });
  const accountant = await User.create({
    name: 'Chief Accountant',
    email: 'accountant_wf@kodbrand.com',
    phone: '9870009999',
    password: 'Password@123',
    role: 'accountant'
  });

  const authRes = await request(app).post('/api/auth/login').send({ email: 'accountant_wf@kodbrand.com', password: 'Password@123' });
  const token = authRes.body.data.token;

  // Setup Project, Unit, Customer, Booking
  const project = await Project.create({ name: 'Emerald Towers', code: 'EMD-TOWERS', location: { city: 'Bangalore' } });
  const property = await Property.create({
    unitNumber: 'EMD-402',
    project: project._id,
    superBuiltUpAreaSqFt: 1800,
    listedPrice: 10000000,
    status: 'Booked'
  });

  const customer = await Customer.create({ name: 'Ananya Roy', phone: '9777888999', email: 'ananya@example.com' });

  const booking = await Booking.create({
    bookingNumber: 'BK-TEST-PAY-01',
    customer: customer._id,
    property: property._id,
    project: project._id,
    bookedBy: accountant._id,
    status: 'Confirmed',
    listedPrice: 10000000,
    discountAmount: 0,
    finalAgreedPrice: 10000000,
    bookingTokenAmount: 0,
    totalPaidAmount: 0,
    outstandingBalance: 10000000
  });

  await PaymentSchedule.create({
    booking: booking._id,
    customer: customer._id,
    totalAmount: 10000000,
    installments: [
      { milestoneName: 'Token Advance', percentage: 10, amountDue: 1000000, dueDate: new Date(), amountPaid: 0, status: 'Pending' },
      { milestoneName: 'Agreement Signing', percentage: 20, amountDue: 2000000, dueDate: new Date(), amountPaid: 0, status: 'Pending' }
    ]
  });

  let paymentId = '';
  const txRef = `NEFT-AXIS-${Date.now()}`;

  await t.test('Record ₹10,00,000 payment and verify automated receipt and balance calculation', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bookingId: booking._id,
        amount: 1000000,
        paymentMethod: 'Bank Transfer (NEFT/RTGS)',
        transactionReference: txRef,
        notes: 'Token advance received via NEFT'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.receiptNumber);
    paymentId = res.body.data._id || res.body.data.id;

    // Verify official receipt exists
    const receipt = await Receipt.findOne({ payment: paymentId });
    assert.ok(receipt);
    assert.equal(receipt.amount, 1000000);

    // Verify booking database balance recalculated
    const updatedBooking = await Booking.findById(booking._id);
    assert.equal(updatedBooking.totalPaidAmount, 1000000);
    assert.equal(updatedBooking.outstandingBalance, 9000000);

    // Verify payment schedule milestone allocated
    const updatedSchedule = await PaymentSchedule.findOne({ booking: booking._id });
    assert.equal(updatedSchedule.installments[0].status, 'Paid');
    assert.equal(updatedSchedule.installments[0].amountPaid, 1000000);

    // Verify auditable transaction in accounts ledger
    const tx = await Transaction.findOne({ payment: paymentId });
    assert.ok(tx);
    assert.equal(tx.type, 'INCOME');
    assert.equal(tx.amount, 1000000);
    assert.equal(tx.category, 'Booking Collection');
  });

  await t.test('Duplicate payment reference prevention prevents double counting', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bookingId: booking._id,
        amount: 1000000,
        transactionReference: txRef
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes('Duplicate payment reference'));
  });

  await t.test('Processing partial refund of ₹2,00,000 updates ledger and recalculates balances', async () => {
    const res = await request(app)
      .post(`/api/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        refundAmount: 200000,
        reason: 'Adjusting excess token deposit'
      });

    assert.equal(res.status, 200);

    // Verify booking balance reconciled
    const updatedBooking = await Booking.findById(booking._id);
    assert.equal(updatedBooking.totalPaidAmount, 800000);
    assert.equal(updatedBooking.outstandingBalance, 9200000);

    // Verify EXPENSE entry created in accounts
    const refundTx = await Transaction.findOne({ category: 'Customer Refund', payment: paymentId });
    assert.ok(refundTx);
    assert.equal(refundTx.type, 'EXPENSE');
    assert.equal(refundTx.amount, 200000);

    // Verify reconciliation summary
    const reconRes = await request(app)
      .get('/api/accounts/reconciliation')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(reconRes.status, 200);
    assert.equal(reconRes.body.data.netCashFlow, 800000); // 1,000,000 - 200,000
  });

  await Project.deleteMany({ code: 'EMD-TOWERS' });
  await Property.deleteMany({ unitNumber: 'EMD-402' });
  await Customer.deleteMany({ phone: '9777888999' });
  await Booking.deleteMany({ _id: booking._id });
  await Payment.deleteMany({ booking: booking._id });
  await Receipt.deleteMany({ booking: booking._id });
  await PaymentSchedule.deleteMany({ booking: booking._id });
  await Transaction.deleteMany({ booking: booking._id });
  await User.deleteMany({ email: 'accountant_wf@kodbrand.com' });
  await disconnectDB();
});
