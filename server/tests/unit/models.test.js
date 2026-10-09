import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Lead from '../../src/models/Lead.js';
import Property from '../../src/models/Property.js';
import Booking from '../../src/models/Booking.js';
import Payment from '../../src/models/Payment.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Unit Tests: Core Data Models & Validation Rules', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_models');

  await t.test('User model hashes password on save and compares correctly', async () => {
    await User.deleteMany({ email: 'test_hash@example.com' });
    const user = new User({
      name: 'Hash Tester',
      email: 'test_hash@example.com',
      phone: '9876543210',
      password: 'PlainPassword123!',
      role: 'sales_executive'
    });
    await user.save();

    assert.notEqual(user.password, 'PlainPassword123!');
    const isMatch = await user.comparePassword('PlainPassword123!');
    assert.equal(isMatch, true);
    const isWrong = await user.comparePassword('WrongPassword');
    assert.equal(isWrong, false);

    await User.deleteMany({ email: 'test_hash@example.com' });
  });

  await t.test('Lead requires leadName and phone, enforces temperature enum', async () => {
    const invalidLead = new Lead({ email: 'nophone@example.com' });
    let err = null;
    try {
      await invalidLead.validate();
    } catch (e) {
      err = e;
    }
    assert.ok(err, 'Expected validation error when leadName and phone are missing');
    assert.ok(err.errors.leadName);
    assert.ok(err.errors.phone);
  });

  await t.test('Property model requires unitNumber, project, superBuiltUpAreaSqFt, and listedPrice', async () => {
    const invalidProp = new Property({});
    let err = null;
    try {
      await invalidProp.validate();
    } catch (e) {
      err = e;
    }
    assert.ok(err);
    assert.ok(err.errors.unitNumber);
    assert.ok(err.errors.project);
    assert.ok(err.errors.superBuiltUpAreaSqFt);
    assert.ok(err.errors.listedPrice);
  });

  await disconnectDB();
});
