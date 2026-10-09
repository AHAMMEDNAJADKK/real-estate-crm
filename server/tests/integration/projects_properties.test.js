import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Project from '../../src/models/Project.js';
import Property from '../../src/models/Property.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

test('Integration Tests: Projects & Property Inventory Workflow', async (t) => {
  await connectDB('mongodb://127.0.0.1:27017/realestate_test_projects');

  // Setup test admin user
  await User.deleteMany({ email: 'project_admin@kodbrand.com' });
  const admin = await User.create({
    name: 'Project Admin',
    email: 'project_admin@kodbrand.com',
    phone: '9876540001',
    password: 'Password@123',
    role: 'super_admin'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'project_admin@kodbrand.com', password: 'Password@123' });
  const token = loginRes.body.data.token;

  let createdProjectId = '';
  let createdPropertyId = '';

  await t.test('Admin creates new Project development with RERA', async () => {
    await Project.deleteMany({ code: 'PRJ-TEST-01' });
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Azure Greens Residency',
        code: 'PRJ-TEST-01',
        description: 'Luxury high-rise apartments in Prime East',
        projectType: 'Residential',
        reraNumber: 'PRM/KA/RERA/1251/310/PR/210101',
        location: {
          city: 'Bangalore',
          state: 'Karnataka',
          address: 'Outer Ring Road, Marathahalli'
        },
        totalUnits: 120
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, 'Azure Greens Residency');
    createdProjectId = res.body.data._id;
  });

  await t.test('Admin adds property unit under created Project', async () => {
    await Property.deleteMany({ project: createdProjectId });
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        unitNumber: 'A-504',
        project: createdProjectId,
        blockOrTower: 'Tower Alpha',
        floor: 5,
        propertyType: '3BHK',
        superBuiltUpAreaSqFt: 1650,
        carpetAreaSqFt: 1320,
        facing: 'East',
        furnishingStatus: 'Semi-Furnished',
        listedPrice: 12500000,
        status: 'Available'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.unitNumber, 'A-504');
    assert.equal(res.body.data.status, 'Available');
    createdPropertyId = res.body.data._id;
  });

  await t.test('Duplicate unit number in same project is prevented', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        unitNumber: 'A-504',
        project: createdProjectId,
        blockOrTower: 'Tower Alpha',
        floor: 5,
        propertyType: '3BHK',
        superBuiltUpAreaSqFt: 1650,
        listedPrice: 12500000
      });

    assert.ok([400, 409].includes(res.status));
    assert.equal(res.body.success, false);
  });

  await t.test('Filter properties by project returns unit list', async () => {
    const res = await request(app)
      .get(`/api/properties?project=${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 1);
    assert.equal(res.body.data[0].unitNumber, 'A-504');
  });

  await disconnectDB();
});
