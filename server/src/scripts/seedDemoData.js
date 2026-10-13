import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Models
import User from '../models/User.js';
import Project from '../models/Project.js';
import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import Lead from '../models/Lead.js';
import Opportunity from '../models/Opportunity.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import PaymentSchedule from '../models/PaymentSchedule.js';
import Receipt from '../models/Receipt.js';
import Commission from '../models/Commission.js';
import Transaction from '../models/Transaction.js';
import CallLog from '../models/CallLog.js';
import FollowUp from '../models/FollowUp.js';
import Meeting from '../models/Meeting.js';
import SiteVisit from '../models/SiteVisit.js';
import Notification from '../models/Notification.js';

export async function seedDemoData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  const explicitDbMatch = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)/i);
  const targetDbName = explicitDbMatch
    ? explicitDbMatch[1]
    : (process.env.MONGODB_DB_NAME || 'realestate_crm').trim();

  console.log(`[Seed] Connecting to MongoDB (${targetDbName})...`);
  await mongoose.connect(uri, {
    ...(explicitDbMatch ? {} : { dbName: targetDbName })
  });
  console.log(`[Seed] Connected to database: ${mongoose.connection.host}/${mongoose.connection.name}`);

  const stats = {
    users: { created: 0, existing: 0 },
    projects: { created: 0, existing: 0 },
    properties: { created: 0, existing: 0 },
    customers: { created: 0, existing: 0 },
    leads: { created: 0, existing: 0 },
    opportunities: { created: 0, existing: 0 },
    bookings: { created: 0, existing: 0 },
    paymentSchedules: { created: 0, existing: 0 },
    payments: { created: 0, existing: 0 },
    receipts: { created: 0, existing: 0 },
    commissions: { created: 0, existing: 0 },
    transactions: { created: 0, existing: 0 },
    callLogs: { created: 0, existing: 0 },
    followUps: { created: 0, existing: 0 },
    meetings: { created: 0, existing: 0 },
    siteVisits: { created: 0, existing: 0 },
    notifications: { created: 0, existing: 0 }
  };

  // -------------------------------------------------------------
  // 1. USERS & STAFF ACCOUNTS
  // -------------------------------------------------------------
  console.log('\n--- 1. Seeding Users ---');
  let superAdmin = await User.findOne({ role: { $in: ['superadmin', 'super_admin'] } });
  let admin = await User.findOne({ role: 'admin' });

  if (!superAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('superadmin@111', salt);
    superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@gmail.com',
      phone: '+91 9995982324',
      password: hash,
      role: 'superadmin',
      department: 'Executive Management',
      isActive: true,
      commissionRate: 1.0
    });
    stats.users.created++;
  } else {
    stats.users.existing++;
  }

  const staffDefinitions = [
    {
      name: 'Priya Sharma',
      email: 'demo.priya@kodbrand.com',
      phone: '+91 98201 11223',
      role: 'sales_manager',
      department: 'Sales Management',
      commissionRate: 1.5
    },
    {
      name: 'Rahul Verma',
      email: 'demo.rahul@kodbrand.com',
      phone: '+91 98202 22334',
      role: 'sales_executive',
      department: 'Direct Sales',
      commissionRate: 1.0
    },
    {
      name: 'Ananya Patel',
      email: 'demo.ananya@kodbrand.com',
      phone: '+91 98203 33445',
      role: 'sales_executive',
      department: 'Direct Sales',
      commissionRate: 1.0
    },
    {
      name: 'Kavita Nair',
      email: 'demo.kavita@kodbrand.com',
      phone: '+91 98204 44556',
      role: 'telecaller',
      department: 'Inside Sales',
      commissionRate: 0.5
    },
    {
      name: 'Vikram Desai',
      email: 'demo.vikram@kodbrand.com',
      phone: '+91 98205 55667',
      role: 'accountant',
      department: 'Finance & Accounts',
      commissionRate: 0
    }
  ];

  const userMap = {};
  userMap['superadmin'] = superAdmin;
  if (admin) userMap['admin'] = admin;

  for (const staff of staffDefinitions) {
    let existing = await User.findOne({ email: staff.email });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password@123', salt);
      existing = await User.create({
        ...staff,
        password: hashedPassword,
        isActive: true,
        reportingManager: staff.role === 'sales_executive' || staff.role === 'telecaller' ? userMap['sales_manager']?._id || superAdmin._id : null
      });
      stats.users.created++;
      console.log(`  + Created user: ${existing.name} (${existing.role})`);
    } else {
      stats.users.existing++;
    }
    userMap[staff.role] = existing;
    userMap[staff.email] = existing;
  }

  const salesManager = userMap['sales_manager'] || superAdmin;
  const salesExec1 = userMap['demo.rahul@kodbrand.com'] || superAdmin;
  const salesExec2 = userMap['demo.ananya@kodbrand.com'] || superAdmin;
  const telecaller = userMap['telecaller'] || superAdmin;
  const accountant = userMap['accountant'] || superAdmin;

  // -------------------------------------------------------------
  // 2. REAL ESTATE PROJECTS
  // -------------------------------------------------------------
  console.log('\n--- 2. Seeding Projects ---');
  const projectDefinitions = [
    {
      name: 'KODBRAND Silicon Heights',
      code: 'DEMO-KSH-01',
      developer: 'KODBRAND Realty Group',
      projectType: 'Residential',
      reraNumber: 'PRM/KA/RERA/1251/446/PR/210312/004011',
      location: {
        address: 'Outer Ring Road, ITPL Main Rd',
        locality: 'Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066'
      },
      totalUnits: 180,
      availableUnits: 45,
      status: 'Under Construction',
      launchDate: new Date('2024-03-15'),
      possessionDate: new Date('2027-12-31'),
      amenities: ['Infinity Pool', 'Clubhouse & Gymnasium', 'Squash Court', 'EV Charging Stations', '24/7 Concierge', 'Landscaped Jogging Track'],
      description: 'Ultra-luxury high-rise residences designed for tech executives in Whitefield corridor.'
    },
    {
      name: 'KODBRAND Palm Meadows',
      code: 'DEMO-KPM-02',
      developer: 'KODBRAND Realty Group',
      projectType: 'Villa Community',
      reraNumber: 'PRM/KA/RERA/1251/308/PR/200115/003180',
      location: {
        address: 'Sarjapur-Marathahalli Rd',
        locality: 'Sarjapur Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '562125'
      },
      totalUnits: 60,
      availableUnits: 14,
      status: 'Ready to Move',
      launchDate: new Date('2023-01-10'),
      possessionDate: new Date('2026-06-30'),
      amenities: ['Private Plunge Pools', 'Bespoke Clubhouse', 'Tennis & Badminton Courts', 'Organic Herb Garden', 'Solar Power Grid'],
      description: 'Exclusive gated enclave of signature 4 & 5 BHK tropical modern villas.'
    },
    {
      name: 'KODBRAND Horizon Towers',
      code: 'DEMO-KHT-03',
      developer: 'KODBRAND Realty Group',
      projectType: 'Mixed Use',
      reraNumber: 'P51800028911',
      location: {
        address: 'Central Avenue, Hiranandani Corridor',
        locality: 'Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400076'
      },
      totalUnits: 240,
      availableUnits: 68,
      status: 'Under Construction',
      launchDate: new Date('2024-08-01'),
      possessionDate: new Date('2028-06-30'),
      amenities: ['Sky Lounge & Observatory', 'Heated Lap Pool', 'Smart Home Automation', 'Helipad Access', 'Valet Parking'],
      description: 'Iconic twin sky-towers overlooking Powai Lake with luxury retail and duplex penthouses.'
    },
    {
      name: 'KODBRAND Cyber Park',
      code: 'DEMO-KCP-04',
      developer: 'KODBRAND Realty Group',
      projectType: 'Commercial',
      reraNumber: 'P02400003421',
      location: {
        address: 'Financial District, Gachibowli',
        locality: 'Hitec City',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081'
      },
      totalUnits: 80,
      availableUnits: 25,
      status: 'Ready to Move',
      launchDate: new Date('2023-06-15'),
      possessionDate: new Date('2025-12-31'),
      amenities: ['Grade-A LEED Gold Certified', 'High-Speed Elevators', 'Double-Height Grand Lobby', 'Fiber Backbone', 'Multi-Level Car Park'],
      description: 'Next-generation commercial office towers offering scalable floor plates.'
    }
  ];

  const projectMap = {};
  for (const p of projectDefinitions) {
    let existing = await Project.findOne({ code: p.code });
    if (!existing) {
      existing = await Project.create(p);
      stats.projects.created++;
      console.log(`  + Created project: ${existing.name} (${existing.code})`);
    } else {
      stats.projects.existing++;
    }
    projectMap[p.code] = existing;
  }

  // -------------------------------------------------------------
  // 3. PROPERTIES / UNITS
  // -------------------------------------------------------------
  console.log('\n--- 3. Seeding Properties / Inventory Units ---');
  const propertyDefinitions = [
    // Silicon Heights
    {
      unitNumber: 'DEMO-KSH-A-302',
      projectCode: 'DEMO-KSH-01',
      blockOrTower: 'Tower A',
      floor: 3,
      propertyType: '2BHK',
      superBuiltUpAreaSqFt: 1280,
      carpetAreaSqFt: 1020,
      facing: 'East',
      furnishingStatus: 'Semi-Furnished',
      listedPrice: 9500000,
      minSellingPrice: 9200000,
      status: 'Available',
      features: ['Balcony Garden', 'Modular Kitchen', 'Piped Gas Connection']
    },
    {
      unitNumber: 'DEMO-KSH-A-704',
      projectCode: 'DEMO-KSH-01',
      blockOrTower: 'Tower A',
      floor: 7,
      propertyType: '3BHK',
      superBuiltUpAreaSqFt: 1820,
      carpetAreaSqFt: 1450,
      facing: 'North-East',
      furnishingStatus: 'Unfurnished',
      listedPrice: 14200000,
      minSellingPrice: 13800000,
      status: 'Available',
      features: ['Corner Unit', 'Park View', 'Italian Marble Flooring']
    },
    {
      unitNumber: 'DEMO-KSH-B-1201',
      projectCode: 'DEMO-KSH-01',
      blockOrTower: 'Tower B',
      floor: 12,
      propertyType: '3BHK',
      superBuiltUpAreaSqFt: 1950,
      carpetAreaSqFt: 1560,
      facing: 'East',
      furnishingStatus: 'Semi-Furnished',
      listedPrice: 15500000,
      minSellingPrice: 15000000,
      status: 'Reserved',
      features: ['Lake View', 'Smart Lighting', 'Master Bedroom Walk-in Closet']
    },
    {
      unitNumber: 'DEMO-KSH-B-1602',
      projectCode: 'DEMO-KSH-01',
      blockOrTower: 'Tower B',
      floor: 16,
      propertyType: '4BHK',
      superBuiltUpAreaSqFt: 2650,
      carpetAreaSqFt: 2120,
      facing: 'North',
      furnishingStatus: 'Fully Furnished',
      listedPrice: 21500000,
      minSellingPrice: 21000000,
      status: 'Booked',
      features: ['Panoramic Skyline View', 'Servant Quarters', 'Home Theater Nook']
    },
    {
      unitNumber: 'DEMO-KSH-B-2201',
      projectCode: 'DEMO-KSH-01',
      blockOrTower: 'Tower B',
      floor: 22,
      propertyType: 'Penthouse',
      superBuiltUpAreaSqFt: 3800,
      carpetAreaSqFt: 3040,
      facing: 'North-East',
      furnishingStatus: 'Unfurnished',
      listedPrice: 34500000,
      minSellingPrice: 33500000,
      status: 'Available',
      features: ['Private Terrace Deck', 'Double Height Living Room', 'Jacuzzi Provision']
    },

    // Palm Meadows
    {
      unitNumber: 'DEMO-KPM-V-08',
      projectCode: 'DEMO-KPM-02',
      blockOrTower: 'Villa Enclave 1',
      floor: 2,
      propertyType: 'Villa',
      superBuiltUpAreaSqFt: 3600,
      carpetAreaSqFt: 2900,
      facing: 'East',
      furnishingStatus: 'Fully Furnished',
      listedPrice: 38500000,
      minSellingPrice: 38000000,
      status: 'Sold',
      features: ['Private Garden & Plunge Pool', 'Double Covered Car Parking', 'Solar Water Heating']
    },
    {
      unitNumber: 'DEMO-KPM-V-15',
      projectCode: 'DEMO-KPM-02',
      blockOrTower: 'Villa Enclave 2',
      floor: 2,
      propertyType: 'Villa',
      superBuiltUpAreaSqFt: 3450,
      carpetAreaSqFt: 2750,
      facing: 'North',
      furnishingStatus: 'Semi-Furnished',
      listedPrice: 36000000,
      minSellingPrice: 35000000,
      status: 'Available',
      features: ['Private Backyard', 'Wooden Deck', 'Modular Italian Kitchen']
    },
    {
      unitNumber: 'DEMO-KPM-V-22',
      projectCode: 'DEMO-KPM-02',
      blockOrTower: 'Villa Enclave 2',
      floor: 2,
      propertyType: 'Villa',
      superBuiltUpAreaSqFt: 4100,
      carpetAreaSqFt: 3300,
      facing: 'East',
      furnishingStatus: 'Unfurnished',
      listedPrice: 43000000,
      minSellingPrice: 42000000,
      status: 'Reserved',
      features: ['Corner Plot Villa', 'Courtyard Architecture', 'Private Elevator Provision']
    },

    // Horizon Towers (Mumbai)
    {
      unitNumber: 'DEMO-KHT-A-1402',
      projectCode: 'DEMO-KHT-03',
      blockOrTower: 'Sky Tower 1',
      floor: 14,
      propertyType: '2BHK',
      superBuiltUpAreaSqFt: 1150,
      carpetAreaSqFt: 920,
      facing: 'West',
      furnishingStatus: 'Unfurnished',
      listedPrice: 18500000,
      minSellingPrice: 18000000,
      status: 'Available',
      features: ['Lake View Balcony', 'Soundproof French Windows', 'Basement Parking']
    },
    {
      unitNumber: 'DEMO-KHT-A-2104',
      projectCode: 'DEMO-KHT-03',
      blockOrTower: 'Sky Tower 1',
      floor: 21,
      propertyType: '3BHK',
      superBuiltUpAreaSqFt: 1750,
      carpetAreaSqFt: 1400,
      facing: 'North-West',
      furnishingStatus: 'Semi-Furnished',
      listedPrice: 27500000,
      minSellingPrice: 26800000,
      status: 'Available',
      features: ['Sunset Deck', 'Central AC Chilled Water System', 'Automated Curtains']
    },
    {
      unitNumber: 'DEMO-KHT-B-2801',
      projectCode: 'DEMO-KHT-03',
      blockOrTower: 'Sky Tower 2',
      floor: 28,
      propertyType: '4BHK',
      superBuiltUpAreaSqFt: 2800,
      carpetAreaSqFt: 2240,
      facing: 'East',
      furnishingStatus: 'Fully Furnished',
      listedPrice: 42000000,
      minSellingPrice: 41500000,
      status: 'Booked',
      features: ['Skyline Panorama', 'Private Foyer', 'Dedicated Service Lift']
    },
    {
      unitNumber: 'DEMO-KHT-B-3401',
      projectCode: 'DEMO-KHT-03',
      blockOrTower: 'Sky Tower 2',
      floor: 34,
      propertyType: 'Penthouse',
      superBuiltUpAreaSqFt: 4500,
      carpetAreaSqFt: 3600,
      facing: 'North-East',
      furnishingStatus: 'Unfurnished',
      listedPrice: 68000000,
      minSellingPrice: 66000000,
      status: 'On Hold',
      features: ['Triplex Layout', 'Private Rooftop Pool', 'Direct Keycard Elevator']
    },

    // Cyber Park (Commercial)
    {
      unitNumber: 'DEMO-KCP-C-401',
      projectCode: 'DEMO-KCP-04',
      blockOrTower: 'Wing C',
      floor: 4,
      propertyType: 'Commercial',
      superBuiltUpAreaSqFt: 2400,
      carpetAreaSqFt: 2000,
      facing: 'North',
      furnishingStatus: 'Unfurnished',
      listedPrice: 21000000,
      minSellingPrice: 20000000,
      status: 'Available',
      features: ['Warm Shell Office', '100% DG Power Backup', 'High Floor Load Capacity']
    },
    {
      unitNumber: 'DEMO-KCP-C-801',
      projectCode: 'DEMO-KCP-04',
      blockOrTower: 'Wing C',
      floor: 8,
      propertyType: 'Commercial',
      superBuiltUpAreaSqFt: 4800,
      carpetAreaSqFt: 4000,
      facing: 'East',
      furnishingStatus: 'Semi-Furnished',
      listedPrice: 42500000,
      minSellingPrice: 41000000,
      status: 'Available',
      features: ['Furnished Executive Floor', 'Conference Rooms Built-in', 'Server Room Setup']
    }
  ];

  const propertyMap = {};
  for (const p of propertyDefinitions) {
    const project = projectMap[p.projectCode];
    if (!project) continue;

    let existing = await Property.findOne({ project: project._id, unitNumber: p.unitNumber });
    if (!existing) {
      existing = await Property.create({
        ...p,
        project: project._id
      });
      stats.properties.created++;
      console.log(`  + Created property unit: ${existing.unitNumber} (${existing.propertyType} - ${existing.status})`);
    } else {
      stats.properties.existing++;
    }
    propertyMap[p.unitNumber] = existing;
  }

  // -------------------------------------------------------------
  // 4. CUSTOMERS
  // -------------------------------------------------------------
  console.log('\n--- 4. Seeding Customers ---');
  const customerDefinitions = [
    {
      name: 'Dr. Sandeep Kulkarni',
      email: 'demo.sandeep.kulkarni@apollohospitals.org',
      phone: '+91 98450 12345',
      customerType: 'Buyer',
      idProofType: 'Aadhaar / National ID',
      idProofNumber: '7890 1234 5678',
      panNumber: 'ABCDE1234F',
      address: {
        street: '42, Prestige Greenwoods, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        country: 'India'
      },
      preferences: {
        propertyType: '3BHK',
        budgetMin: 14000000,
        budgetMax: 18000000,
        preferredLocation: 'Whitefield',
        minBedrooms: 3
      },
      assignedAgent: salesExec1._id,
      status: 'Booked',
      notes: 'Consultant cardiologist at Apollo. Bought Silicon Heights 3BHK Unit B-1201 for family.'
    },
    {
      name: 'Anita & Suresh Menon',
      email: 'demo.menon.family@gmail.com',
      phone: '+91 98451 23456',
      customerType: 'Buyer',
      idProofType: 'Passport',
      idProofNumber: 'P8923412',
      panNumber: 'BCDEF2345G',
      address: {
        street: '15, Villa Grande, Sarjapur Main Rd',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '562125',
        country: 'India'
      },
      preferences: {
        propertyType: 'Villa',
        budgetMin: 35000000,
        budgetMax: 45000000,
        preferredLocation: 'Sarjapur Road',
        minBedrooms: 4
      },
      assignedAgent: salesExec2._id,
      status: 'Closed',
      notes: 'NRI returnees from Singapore. Fully purchased and registered Villa V-08 in Palm Meadows.'
    },
    {
      name: 'Amitav Sen',
      email: 'demo.amitav.sen@senholdings.in',
      phone: '+91 98452 34567',
      customerType: 'Investor',
      idProofType: 'Aadhaar / National ID',
      idProofNumber: '6543 9876 2109',
      panNumber: 'CDEFG3456H',
      address: {
        street: '802, Jubilee Heights, Road No. 36',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
        country: 'India'
      },
      preferences: {
        propertyType: 'Commercial',
        budgetMin: 30000000,
        budgetMax: 50000000,
        preferredLocation: 'Hitec City',
        minBedrooms: 0
      },
      assignedAgent: salesExec1._id,
      status: 'Active Opportunity',
      notes: 'Angel investor evaluating commercial office lease yields in Cyber Park.'
    },
    {
      name: 'Radhika Merchant',
      email: 'demo.radhika.m@luxuryliving.com',
      phone: '+91 98453 45678',
      customerType: 'Buyer',
      idProofType: 'Aadhaar / National ID',
      idProofNumber: '9012 3456 7890',
      panNumber: 'DEFGH4567I',
      address: {
        street: 'Penthouse 4, Imperial Heights, Altamount Rd',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400026',
        country: 'India'
      },
      preferences: {
        propertyType: '4BHK',
        budgetMin: 35000000,
        budgetMax: 50000000,
        preferredLocation: 'Powai',
        minBedrooms: 4
      },
      assignedAgent: salesManager._id,
      status: 'Booked',
      notes: 'Managing Director of design studio. Reserved unit B-2801 in Horizon Towers.'
    },
    {
      name: 'Col. Raghavan Pillai',
      email: 'demo.raghavan.p@defence.gov.in',
      phone: '+91 98454 56789',
      customerType: 'Buyer',
      idProofType: 'Defence Service ID',
      idProofNumber: 'DEF-892144',
      panNumber: 'EFGHI5678J',
      address: {
        street: 'Officers Enclave, ASC Center',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560007',
        country: 'India'
      },
      preferences: {
        propertyType: '3BHK',
        budgetMin: 12000000,
        budgetMax: 15000000,
        preferredLocation: 'Whitefield',
        minBedrooms: 3
      },
      assignedAgent: salesExec2._id,
      status: 'Active Opportunity',
      notes: 'Retired army colonel looking for post-retirement peaceful home with green park views.'
    },
    {
      name: 'Meenakshi Sundaram',
      email: 'demo.meenakshi.s@tcs.com',
      phone: '+91 98455 67890',
      customerType: 'Buyer',
      idProofType: 'Aadhaar / National ID',
      idProofNumber: '3456 7890 1234',
      panNumber: 'FGHIJ6789K',
      address: {
        street: 'Block 4, Palm Springs, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        country: 'India'
      },
      preferences: {
        propertyType: '2BHK',
        budgetMin: 8500000,
        budgetMax: 10500000,
        preferredLocation: 'Whitefield',
        minBedrooms: 2
      },
      assignedAgent: salesExec1._id,
      status: 'Lead Qualified',
      notes: 'Software architect at TCS. Shortlisted 2BHK unit A-302 in Silicon Heights.'
    }
  ];

  const customerMap = {};
  for (const c of customerDefinitions) {
    let existing = await Customer.findOne({ email: c.email });
    if (!existing) {
      existing = await Customer.create(c);
      stats.customers.created++;
      console.log(`  + Created customer: ${existing.name} (${existing.customerType} - ${existing.status})`);
    } else {
      stats.customers.existing++;
    }
    customerMap[c.email] = existing;
  }

  const custSandeep = customerMap['demo.sandeep.kulkarni@apollohospitals.org'];
  const custMenon = customerMap['demo.menon.family@gmail.com'];
  const custAmitav = customerMap['demo.amitav.sen@senholdings.in'];
  const custRadhika = customerMap['demo.radhika.m@luxuryliving.com'];
  const custRaghavan = customerMap['demo.raghavan.p@defence.gov.in'];
  const custMeenakshi = customerMap['demo.meenakshi.s@tcs.com'];

  // -------------------------------------------------------------
  // 5. LEADS (Diverse sources, temperatures, and statuses)
  // -------------------------------------------------------------
  console.log('\n--- 5. Seeding Leads ---');
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  const leadDefinitions = [
    // HOT LEADS (High intent, active enquiry)
    {
      leadName: 'Vikram Singhania',
      phone: '+91 97110 11001',
      email: 'demo.vikram.singhania@fintech.co',
      city: 'Mumbai',
      source: 'Google Ads',
      status: 'Interested',
      temperature: 'Hot',
      priority: 'High',
      budgetMin: 25000000,
      budgetMax: 30000000,
      preferredLocation: 'Powai, Mumbai',
      preferredPropertyType: '3BHK',
      assignedTo: salesManager._id,
      interestedProject: projectMap['DEMO-KHT-03']?._id,
      interestedProperty: propertyMap['DEMO-KHT-A-2104']?._id,
      remarks: 'VP at Goldman Sachs. Looking for urgent purchase in Horizon Towers.',
      nextFollowUpDate: tomorrow,
      lastContactedAt: now
    },
    {
      leadName: 'Pooja Bansal',
      phone: '+91 97110 11002',
      email: 'demo.pooja.bansal@biotech.in',
      city: 'Bangalore',
      source: 'Meta Ads',
      status: 'Qualified',
      temperature: 'Hot',
      priority: 'High',
      budgetMin: 14000000,
      budgetMax: 16500000,
      preferredLocation: 'Whitefield',
      preferredPropertyType: '3BHK',
      assignedTo: salesExec1._id,
      interestedProject: projectMap['DEMO-KSH-01']?._id,
      remarks: 'Has pre-approved home loan from HDFC for ₹1.5 Cr. Wants site visit this weekend.',
      nextFollowUpDate: tomorrow,
      lastContactedAt: yesterday
    },
    {
      leadName: 'Rohan Kapoor',
      phone: '+91 97110 11003',
      email: 'demo.rohan.kapoor@ventures.com',
      city: 'Bangalore',
      source: 'Website',
      status: 'New',
      temperature: 'Hot',
      priority: 'High',
      budgetMin: 35000000,
      budgetMax: 45000000,
      preferredLocation: 'Sarjapur Road',
      preferredPropertyType: 'Villa',
      assignedTo: salesExec2._id,
      interestedProject: projectMap['DEMO-KPM-02']?._id,
      remarks: 'Inquired online for Palm Meadows Villa 15. Requires immediate callback.',
      nextFollowUpDate: now,
      lastContactedAt: null
    },
    {
      leadName: 'Siddharth Nambiar',
      phone: '+91 97110 11004',
      email: 'demo.siddharth.n@infosec.com',
      city: 'Hyderabad',
      source: 'Walk-in',
      status: 'Interested',
      temperature: 'Hot',
      priority: 'High',
      budgetMin: 20000000,
      budgetMax: 25000000,
      preferredLocation: 'Hitec City',
      preferredPropertyType: 'Commercial',
      assignedTo: salesExec1._id,
      interestedProject: projectMap['DEMO-KCP-04']?._id,
      remarks: 'Visited Cyber Park sales office yesterday. Requested lease draft.',
      nextFollowUpDate: tomorrow,
      lastContactedAt: yesterday
    },

    // WARM LEADS (Considering options, steady engagement)
    {
      leadName: 'Karthik Narayanan',
      phone: '+91 97110 11005',
      email: 'demo.karthik.n@wipro.com',
      city: 'Bangalore',
      source: 'Meta Ads',
      status: 'Contacted',
      temperature: 'Warm',
      priority: 'Medium',
      budgetMin: 9000000,
      budgetMax: 11000000,
      preferredLocation: 'Whitefield',
      preferredPropertyType: '2BHK',
      assignedTo: telecaller._id,
      interestedProject: projectMap['DEMO-KSH-01']?._id,
      remarks: 'Discussed Silicon Heights 2BHK floor plans. Sent brochure on WhatsApp.',
      nextFollowUpDate: tomorrow,
      lastContactedAt: now
    },
    {
      leadName: 'Deepa Shenoy',
      phone: '+91 97110 11006',
      email: 'demo.deepa.shenoy@lawchambers.in',
      city: 'Mumbai',
      source: 'Google Ads',
      status: 'Follow Up',
      temperature: 'Warm',
      priority: 'Medium',
      budgetMin: 18000000,
      budgetMax: 20000000,
      preferredLocation: 'Powai',
      preferredPropertyType: '2BHK',
      assignedTo: salesManager._id,
      interestedProject: projectMap['DEMO-KHT-03']?._id,
      remarks: 'Comparing with adjacent Hiranandani project. Needs pricing discount sheet.',
      nextFollowUpDate: nextWeek,
      lastContactedAt: yesterday
    },
    {
      leadName: 'Gaurav Joshi',
      phone: '+91 97110 11007',
      email: 'demo.gaurav.joshi@startup.io',
      city: 'Bangalore',
      source: 'Referral',
      status: 'Follow Up',
      temperature: 'Warm',
      priority: 'Medium',
      budgetMin: 13000000,
      budgetMax: 16000000,
      preferredLocation: 'Whitefield',
      preferredPropertyType: '3BHK',
      assignedTo: salesExec2._id,
      interestedProject: projectMap['DEMO-KSH-01']?._id,
      remarks: 'Referred by existing resident Dr. Sandeep Kulkarni. Interested in Tower A.',
      nextFollowUpDate: now,
      lastContactedAt: twoDaysAgo
    },
    {
      leadName: 'Smita Deshmukh',
      phone: '+91 97110 11008',
      email: 'demo.smita.d@cloudservices.com',
      city: 'Bangalore',
      source: 'Property Portal',
      status: 'New',
      temperature: 'Warm',
      priority: 'Medium',
      budgetMin: 8500000,
      budgetMax: 10000000,
      preferredLocation: 'Whitefield',
      preferredPropertyType: '2BHK',
      assignedTo: telecaller._id,
      interestedProject: projectMap['DEMO-KSH-01']?._id,
      remarks: 'Submitted lead on 99acres portal for Silicon Heights.',
      nextFollowUpDate: now,
      lastContactedAt: null
    },
    {
      leadName: 'Tanvi Agarwal',
      phone: '+91 97110 11009',
      email: 'demo.tanvi.a@consulting.com',
      city: 'Bangalore',
      source: 'Website',
      status: 'Contacted',
      temperature: 'Warm',
      priority: 'Medium',
      budgetMin: 14000000,
      budgetMax: 17000000,
      preferredLocation: 'Whitefield',
      preferredPropertyType: '3BHK',
      assignedTo: salesExec1._id,
      interestedProject: projectMap['DEMO-KSH-01']?._id,
      remarks: 'Spoke briefly. Requested callback today afternoon regarding payment plans.',
      nextFollowUpDate: now,
      lastContactedAt: yesterday
    },

    // COLD LEADS (Long-term horizon or low engagement)
    {
      leadName: 'Arun Kumar',
      phone: '+91 97110 11010',
      email: 'demo.arun.kumar@gmail.com',
      city: 'Bangalore',
      source: 'Meta Ads',
      status: 'Contacted',
      temperature: 'Cold',
      priority: 'Low',
      budgetMin: 7000000,
      budgetMax: 8500000,
      preferredLocation: 'North Bangalore',
      preferredPropertyType: '2BHK',
      assignedTo: telecaller._id,
      remarks: 'Planning purchase only by end of next financial year.',
      nextFollowUpDate: nextWeek,
      lastContactedAt: twoDaysAgo
    },
    {
      leadName: 'Rameshwar Rao',
      phone: '+91 97110 11011',
      email: 'demo.rameshwar.rao@yahoo.com',
      city: 'Hyderabad',
      source: 'Google Ads',
      status: 'Follow Up',
      temperature: 'Cold',
      priority: 'Low',
      budgetMin: 15000000,
      budgetMax: 18000000,
      preferredLocation: 'Gachibowli',
      preferredPropertyType: 'Commercial',
      assignedTo: telecaller._id,
      remarks: 'Currently evaluating Hyderabad market trends, no immediate requirement.',
      nextFollowUpDate: nextWeek,
      lastContactedAt: twoDaysAgo
    },

    // RNT (Ringing Not Taken) & SWITCHED OFF LEADS
    {
      leadName: 'Geeta Krishnan',
      phone: '+91 97110 11012',
      email: 'demo.geeta.k@hotmail.com',
      city: 'Bangalore',
      source: 'Meta Ads',
      status: 'Follow Up',
      temperature: 'RNT',
      priority: 'Medium',
      budgetMin: 9500000,
      budgetMax: 11000000,
      preferredLocation: 'Whitefield',
      preferredPropertyType: '2BHK',
      assignedTo: telecaller._id,
      remarks: 'Ringing not answered twice. Scheduled automated follow-up attempt.',
      nextFollowUpDate: tomorrow,
      lastContactedAt: now
    },
    {
      leadName: 'Devendra Chawla',
      phone: '+91 97110 11013',
      email: 'demo.devendra.c@retail.com',
      city: 'Mumbai',
      source: 'Google Ads',
      status: 'Follow Up',
      temperature: 'RNT',
      priority: 'Low',
      budgetMin: 20000000,
      budgetMax: 25000000,
      preferredLocation: 'Powai',
      preferredPropertyType: '3BHK',
      assignedTo: telecaller._id,
      remarks: 'Number rang continuously without pickup.',
      nextFollowUpDate: tomorrow,
      lastContactedAt: yesterday
    },
    {
      leadName: 'Farhan Qureshi',
      phone: '+91 97110 11014',
      email: 'demo.farhan.q@freight.com',
      city: 'Bangalore',
      source: 'Property Portal',
      status: 'Contacted',
      temperature: 'SwitchedOff',
      priority: 'Low',
      budgetMin: 12000000,
      budgetMax: 15000000,
      preferredLocation: 'Whitefield',
      preferredPropertyType: '3BHK',
      assignedTo: telecaller._id,
      remarks: 'Phone switched off on 2 consecutive attempts.',
      nextFollowUpDate: nextWeek,
      lastContactedAt: twoDaysAgo
    },

    // LOST LEAD
    {
      leadName: 'Alok Gupta',
      phone: '+91 97110 11015',
      email: 'demo.alok.gupta@finholdings.com',
      city: 'Bangalore',
      source: 'Meta Ads',
      status: 'Lost',
      temperature: 'Cold',
      priority: 'Low',
      budgetMin: 6000000,
      budgetMax: 7500000,
      preferredLocation: 'Electronic City',
      preferredPropertyType: '2BHK',
      assignedTo: telecaller._id,
      remarks: 'Purchased another project in Electronic City closer to his workplace.',
      lostReason: 'Purchased competitor project closer to office',
      nextFollowUpDate: null,
      lastContactedAt: twoDaysAgo
    },

    // CONVERTED LEADS
    {
      leadName: 'Dr. Sandeep Kulkarni (Inquiry)',
      phone: '+91 98450 12345',
      email: 'demo.sandeep.kulkarni@apollohospitals.org',
      city: 'Bangalore',
      source: 'Website',
      status: 'Converted',
      temperature: 'Hot',
      priority: 'High',
      budgetMin: 15000000,
      budgetMax: 17000000,
      preferredLocation: 'Whitefield',
      preferredPropertyType: '3BHK',
      assignedTo: salesExec1._id,
      customer: custSandeep?._id,
      interestedProject: projectMap['DEMO-KSH-01']?._id,
      interestedProperty: propertyMap['DEMO-KSH-B-1201']?._id,
      remarks: 'Converted into booked buyer for Silicon Heights Unit B-1201.',
      convertedAt: yesterday,
      lastContactedAt: yesterday
    },
    {
      leadName: 'Anita Menon (Inquiry)',
      phone: '+91 98451 23456',
      email: 'demo.menon.family@gmail.com',
      city: 'Bangalore',
      source: 'Referral',
      status: 'Converted',
      temperature: 'Hot',
      priority: 'High',
      budgetMin: 35000000,
      budgetMax: 45000000,
      preferredLocation: 'Sarjapur Road',
      preferredPropertyType: 'Villa',
      assignedTo: salesExec2._id,
      customer: custMenon?._id,
      interestedProject: projectMap['DEMO-KPM-02']?._id,
      interestedProperty: propertyMap['DEMO-KPM-V-08']?._id,
      remarks: 'Converted into registered owner for Palm Meadows Villa 08.',
      convertedAt: twoDaysAgo,
      lastContactedAt: twoDaysAgo
    }
  ];

  const leadMap = {};
  for (const l of leadDefinitions) {
    let existing = await Lead.findOne({ email: l.email });
    if (!existing) {
      existing = await Lead.create(l);
      stats.leads.created++;
      console.log(`  + Created lead: ${existing.leadName} (${existing.temperature} - ${existing.status})`);
    } else {
      stats.leads.existing++;
    }
    leadMap[l.email] = existing;
  }

  // -------------------------------------------------------------
  // 6. OPPORTUNITIES (Pipeline stages)
  // -------------------------------------------------------------
  console.log('\n--- 6. Seeding Opportunities ---');
  const opportunityDefinitions = [
    {
      title: 'Dr. Sandeep Kulkarni - Silicon Heights 3BHK B-1201',
      customer: custSandeep?._id,
      project: projectMap['DEMO-KSH-01']?._id,
      property: propertyMap['DEMO-KSH-B-1201']?._id,
      assignedSalesExecutive: salesExec1._id,
      stage: 'Closed Won',
      expectedRevenue: 15500000,
      probability: 100,
      expectedCloseDate: yesterday,
      nextAction: 'Complete final loan documentation',
      closedAt: yesterday
    },
    {
      title: 'Menon Family - Palm Meadows Villa 08',
      customer: custMenon?._id,
      project: projectMap['DEMO-KPM-02']?._id,
      property: propertyMap['DEMO-KPM-V-08']?._id,
      assignedSalesExecutive: salesExec2._id,
      stage: 'Closed Won',
      expectedRevenue: 38500000,
      probability: 100,
      expectedCloseDate: twoDaysAgo,
      nextAction: 'Handover complete and keys delivered',
      closedAt: twoDaysAgo
    },
    {
      title: 'Radhika Merchant - Horizon Sky Penthouse B-2801',
      customer: custRadhika?._id,
      project: projectMap['DEMO-KHT-03']?._id,
      property: propertyMap['DEMO-KHT-B-2801']?._id,
      assignedSalesExecutive: salesManager._id,
      stage: 'Booking Initiated',
      expectedRevenue: 42000000,
      probability: 90,
      expectedCloseDate: nextWeek,
      nextAction: 'Finalize customized interior layout terms'
    },
    {
      title: 'Amitav Sen - Cyber Park Commercial Wing C Floor 8',
      customer: custAmitav?._id,
      project: projectMap['DEMO-KCP-04']?._id,
      property: propertyMap['DEMO-KCP-C-801']?._id,
      assignedSalesExecutive: salesExec1._id,
      stage: 'Negotiation',
      expectedRevenue: 42500000,
      probability: 75,
      expectedCloseDate: nextWeek,
      nextAction: 'Present revised lease yield projections'
    },
    {
      title: 'Col. Raghavan Pillai - Silicon Heights 3BHK Corner A-704',
      customer: custRaghavan?._id,
      project: projectMap['DEMO-KSH-01']?._id,
      property: propertyMap['DEMO-KSH-A-704']?._id,
      assignedSalesExecutive: salesExec2._id,
      stage: 'Site Visit Completed',
      expectedRevenue: 14200000,
      probability: 60,
      expectedCloseDate: nextWeek,
      nextAction: 'Share bank approval eligibility report'
    },
    {
      title: 'Meenakshi Sundaram - Silicon Heights 2BHK A-302',
      customer: custMeenakshi?._id,
      project: projectMap['DEMO-KSH-01']?._id,
      property: propertyMap['DEMO-KSH-A-302']?._id,
      assignedSalesExecutive: salesExec1._id,
      stage: 'Property Shortlisted',
      expectedRevenue: 9500000,
      probability: 40,
      expectedCloseDate: nextWeek,
      nextAction: 'Schedule joint visit with spouse'
    },
    {
      title: 'Vikram Singhania - Horizon Towers 3BHK A-2104',
      customer: custRadhika?._id,
      project: projectMap['DEMO-KHT-03']?._id,
      property: propertyMap['DEMO-KHT-A-2104']?._id,
      assignedSalesExecutive: salesManager._id,
      stage: 'Site Visit Scheduled',
      expectedRevenue: 27500000,
      probability: 50,
      expectedCloseDate: nextWeek,
      nextAction: 'Confirm pickup arrangement for site inspection'
    },
    {
      title: 'Alok Gupta - Budget Mismatch Prospect',
      customer: custMeenakshi?._id,
      project: projectMap['DEMO-KSH-01']?._id,
      assignedSalesExecutive: salesExec1._id,
      stage: 'Closed Lost',
      expectedRevenue: 8500000,
      probability: 0,
      expectedCloseDate: twoDaysAgo,
      lostReason: 'Budget constraints outside project pricing bracket',
      closedAt: twoDaysAgo
    }
  ];

  const oppMap = {};
  for (const opp of opportunityDefinitions) {
    if (!opp.customer) continue;
    let existing = await Opportunity.findOne({ title: opp.title });
    if (!existing) {
      existing = await Opportunity.create(opp);
      stats.opportunities.created++;
      console.log(`  + Created opportunity: ${existing.title} (${existing.stage} - ₹${existing.expectedRevenue})`);
    } else {
      stats.opportunities.existing++;
    }
    oppMap[opp.title] = existing;
  }

  // -------------------------------------------------------------
  // 7. BOOKINGS
  // -------------------------------------------------------------
  console.log('\n--- 7. Seeding Bookings ---');
  const bookingDefinitions = [
    {
      bookingNumber: 'DEMO-BK-2026-001',
      customer: custSandeep?._id,
      property: propertyMap['DEMO-KSH-B-1201']?._id,
      project: projectMap['DEMO-KSH-01']?._id,
      bookedBy: salesExec1._id,
      confirmedBy: superAdmin._id,
      status: 'Confirmed',
      listedPrice: 15500000,
      discountAmount: 300000,
      finalAgreedPrice: 15200000,
      bookingTokenAmount: 1000000,
      totalPaidAmount: 4500000,
      outstandingBalance: 10700000,
      agreementSigned: true,
      confirmedAt: yesterday,
      remarks: '3BHK unit booked by Dr. Sandeep Kulkarni with 10% token and 20% slab payment paid.'
    },
    {
      bookingNumber: 'DEMO-BK-2026-002',
      customer: custMenon?._id,
      property: propertyMap['DEMO-KPM-V-08']?._id,
      project: projectMap['DEMO-KPM-02']?._id,
      bookedBy: salesExec2._id,
      confirmedBy: superAdmin._id,
      status: 'Completed',
      listedPrice: 38500000,
      discountAmount: 500000,
      finalAgreedPrice: 38000000,
      bookingTokenAmount: 2500000,
      totalPaidAmount: 38000000,
      outstandingBalance: 0,
      agreementSigned: true,
      confirmedAt: twoDaysAgo,
      remarks: 'Villa 08 fully paid, registered, and handed over to Menon family.'
    },
    {
      bookingNumber: 'DEMO-BK-2026-003',
      customer: custRadhika?._id,
      property: propertyMap['DEMO-KHT-B-2801']?._id,
      project: projectMap['DEMO-KHT-03']?._id,
      bookedBy: salesManager._id,
      confirmedBy: superAdmin._id,
      status: 'Confirmed',
      listedPrice: 42000000,
      discountAmount: 0,
      finalAgreedPrice: 42000000,
      bookingTokenAmount: 2000000,
      totalPaidAmount: 6500000,
      outstandingBalance: 35500000,
      agreementSigned: true,
      confirmedAt: now,
      remarks: 'Skyline 4BHK booked by Radhika Merchant in Horizon Towers.'
    },
    {
      bookingNumber: 'DEMO-BK-2026-004',
      customer: custAmitav?._id,
      property: propertyMap['DEMO-KPM-V-22']?._id,
      project: projectMap['DEMO-KPM-02']?._id,
      bookedBy: salesExec2._id,
      status: 'Reserved',
      listedPrice: 43000000,
      discountAmount: 500000,
      finalAgreedPrice: 42500000,
      bookingTokenAmount: 1500000,
      totalPaidAmount: 1500000,
      outstandingBalance: 41000000,
      agreementSigned: false,
      reservationExpiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      remarks: 'Token advance received. Allotment letter issued pending final agreement.'
    }
  ];

  const bookingMap = {};
  for (const b of bookingDefinitions) {
    if (!b.customer || !b.property || !b.project) continue;
    let existing = await Booking.findOne({ bookingNumber: b.bookingNumber });
    if (!existing) {
      existing = await Booking.create(b);
      stats.bookings.created++;
      console.log(`  + Created booking: ${existing.bookingNumber} (${existing.status} - ₹${existing.finalAgreedPrice})`);

      // Update property currentBooking link
      await Property.findByIdAndUpdate(b.property, { currentBooking: existing._id });
    } else {
      stats.bookings.existing++;
    }
    bookingMap[b.bookingNumber] = existing;
  }

  // -------------------------------------------------------------
  // 8. PAYMENT SCHEDULES, PAYMENTS & RECEIPTS
  // -------------------------------------------------------------
  console.log('\n--- 8. Seeding Payment Schedules, Payments & Receipts ---');

  // Milestone schedule for Booking 1 (Silicon Heights 3BHK - ₹1,52,00,000)
  const bk1 = bookingMap['DEMO-BK-2026-001'];
  if (bk1) {
    let existingSched = await PaymentSchedule.findOne({ booking: bk1._id });
    if (!existingSched) {
      existingSched = await PaymentSchedule.create({
        booking: bk1._id,
        customer: bk1.customer,
        totalAmount: bk1.finalAgreedPrice,
        installments: [
          { milestoneName: 'Booking Token Advance', percentage: 10, amountDue: 1520000, dueDate: new Date('2024-04-01'), amountPaid: 1520000, status: 'Paid' },
          { milestoneName: 'Foundation & Excavation Complete', percentage: 20, amountDue: 3040000, dueDate: new Date('2024-08-01'), amountPaid: 2980000, status: 'Partially Paid' },
          { milestoneName: '12th Floor Slab Completion', percentage: 25, amountDue: 3800000, dueDate: new Date('2026-11-15'), amountPaid: 0, status: 'Pending' },
          { milestoneName: 'Finishing & Internal Plastering', percentage: 25, amountDue: 3800000, dueDate: new Date('2027-04-15'), amountPaid: 0, status: 'Pending' },
          { milestoneName: 'Key Handover & Possession', percentage: 20, amountDue: 3040000, dueDate: new Date('2027-12-31'), amountPaid: 0, status: 'Pending' }
        ]
      });
      stats.paymentSchedules.created++;
      console.log(`  + Created PaymentSchedule for Booking ${bk1.bookingNumber}`);
    } else {
      stats.paymentSchedules.existing++;
    }
  }

  // Payments definitions
  const paymentDefinitions = [
    // Booking 1 payments
    {
      paymentNumber: 'DEMO-PAY-2026-001',
      bookingId: bk1?._id,
      customer: custSandeep?._id,
      amount: 1000000,
      paymentMethod: 'Bank Transfer (NEFT/RTGS)',
      transactionReference: 'HDFC-RTGS-9821448',
      status: 'Successful',
      paymentDate: new Date('2024-04-01'),
      recordedBy: salesExec1._id,
      verifiedBy: accountant._id,
      notes: 'Initial booking token transfer verified in Escrow account'
    },
    {
      paymentNumber: 'DEMO-PAY-2026-002',
      bookingId: bk1?._id,
      customer: custSandeep?._id,
      amount: 3500000,
      paymentMethod: 'Bank Transfer (NEFT/RTGS)',
      transactionReference: 'HDFC-NEFT-1029481',
      status: 'Successful',
      paymentDate: yesterday,
      recordedBy: salesExec1._id,
      verifiedBy: accountant._id,
      notes: 'Foundation milestone installment cleared'
    },

    // Booking 2 payments (Menon Villa - fully paid ₹3.8 Cr)
    {
      paymentNumber: 'DEMO-PAY-2026-003',
      bookingId: bookingMap['DEMO-BK-2026-002']?._id,
      customer: custMenon?._id,
      amount: 2500000,
      paymentMethod: 'Cheque',
      transactionReference: 'CHQ-890214',
      status: 'Successful',
      paymentDate: new Date('2024-01-15'),
      recordedBy: salesExec2._id,
      verifiedBy: accountant._id,
      notes: 'Villa booking token cheque cleared'
    },
    {
      paymentNumber: 'DEMO-PAY-2026-004',
      bookingId: bookingMap['DEMO-BK-2026-002']?._id,
      customer: custMenon?._id,
      amount: 15500000,
      paymentMethod: 'Bank Transfer (NEFT/RTGS)',
      transactionReference: 'ICICI-RTGS-349012',
      status: 'Successful',
      paymentDate: new Date('2024-06-20'),
      recordedBy: salesExec2._id,
      verifiedBy: accountant._id,
      notes: 'Structure milestone remittance'
    },
    {
      paymentNumber: 'DEMO-PAY-2026-005',
      bookingId: bookingMap['DEMO-BK-2026-002']?._id,
      customer: custMenon?._id,
      amount: 20000000,
      paymentMethod: 'Bank Transfer (NEFT/RTGS)',
      transactionReference: 'ICICI-RTGS-891024',
      status: 'Successful',
      paymentDate: twoDaysAgo,
      recordedBy: salesExec2._id,
      verifiedBy: accountant._id,
      notes: 'Final settlement on possession and deed registration'
    },

    // Booking 3 payments (Radhika Merchant Horizon Towers - ₹65 Lakhs paid)
    {
      paymentNumber: 'DEMO-PAY-2026-006',
      bookingId: bookingMap['DEMO-BK-2026-003']?._id,
      customer: custRadhika?._id,
      amount: 2000000,
      paymentMethod: 'Bank Transfer (NEFT/RTGS)',
      transactionReference: 'KOTAK-RTGS-789012',
      status: 'Successful',
      paymentDate: yesterday,
      recordedBy: salesManager._id,
      verifiedBy: accountant._id,
      notes: 'Token advance for Penthouse B-2801'
    },
    {
      paymentNumber: 'DEMO-PAY-2026-007',
      bookingId: bookingMap['DEMO-BK-2026-003']?._id,
      customer: custRadhika?._id,
      amount: 4500000,
      paymentMethod: 'Bank Transfer (NEFT/RTGS)',
      transactionReference: 'KOTAK-RTGS-901245',
      status: 'Successful',
      paymentDate: now,
      recordedBy: salesManager._id,
      verifiedBy: accountant._id,
      notes: 'Allotment confirmation installment'
    },

    // Booking 4 payments (Amitav Sen - Token ₹15 Lakhs)
    {
      paymentNumber: 'DEMO-PAY-2026-008',
      bookingId: bookingMap['DEMO-BK-2026-004']?._id,
      customer: custAmitav?._id,
      amount: 1500000,
      paymentMethod: 'UPI',
      transactionReference: 'UPI-AXIS-9921049182',
      status: 'Successful',
      paymentDate: now,
      recordedBy: salesExec2._id,
      verifiedBy: accountant._id,
      notes: 'Token reservation transfer via corporate UPI handle'
    }
  ];

  const paymentMap = {};
  for (const pay of paymentDefinitions) {
    if (!pay.bookingId || !pay.customer) continue;
    let existing = await Payment.findOne({ paymentNumber: pay.paymentNumber });
    if (!existing) {
      existing = await Payment.create({
        ...pay,
        booking: pay.bookingId
      });
      stats.payments.created++;
      console.log(`  + Created payment: ${existing.paymentNumber} (₹${existing.amount} - ${existing.status})`);

      // Generate corresponding Receipt
      const receiptNum = `DEMO-RCP-${pay.paymentNumber.replace('DEMO-PAY-', '')}`;
      let existingReceipt = await Receipt.findOne({ receiptNumber: receiptNum });
      if (!existingReceipt) {
        existingReceipt = await Receipt.create({
          receiptNumber: receiptNum,
          payment: existing._id,
          booking: pay.bookingId,
          customer: pay.customer,
          amount: pay.amount,
          issuedDate: pay.paymentDate,
          issuedBy: pay.verifiedBy || superAdmin._id,
          remarks: `Official real estate acknowledgement for ${pay.notes}`
        });
        stats.receipts.created++;

        // Update payment with receiptNumber
        await Payment.findByIdAndUpdate(existing._id, { receiptNumber: receiptNum });
      } else {
        stats.receipts.existing++;
      }
    } else {
      stats.payments.existing++;
    }
    paymentMap[pay.paymentNumber] = existing;
  }

  // -------------------------------------------------------------
  // 9. COMMISSIONS
  // -------------------------------------------------------------
  console.log('\n--- 9. Seeding Agent Commissions ---');
  const commissionDefinitions = [
    {
      booking: bk1?._id,
      agent: salesExec1._id,
      commissionType: 'Percentage',
      rate: 1.0,
      saleValue: 15200000,
      commissionAmount: 152000,
      status: 'Approved',
      approvedBy: superAdmin._id,
      approvedAt: yesterday,
      notes: '1.0% executive commission for Silicon Heights booking BK-001'
    },
    {
      booking: bookingMap['DEMO-BK-2026-002']?._id,
      agent: salesExec2._id,
      commissionType: 'Percentage',
      rate: 1.0,
      saleValue: 38000000,
      commissionAmount: 380000,
      status: 'Paid',
      approvedBy: superAdmin._id,
      approvedAt: twoDaysAgo,
      paidAt: yesterday,
      paymentReference: 'HDFC-RTGS-982103',
      notes: '1.0% executive commission for Palm Meadows Villa 08 sale'
    },
    {
      booking: bookingMap['DEMO-BK-2026-003']?._id,
      agent: salesManager._id,
      commissionType: 'Percentage',
      rate: 1.5,
      saleValue: 42000000,
      commissionAmount: 630000,
      status: 'Pending',
      notes: '1.5% managerial commission for Horizon Sky Penthouse closure'
    },
    {
      booking: bookingMap['DEMO-BK-2026-004']?._id,
      agent: salesExec2._id,
      commissionType: 'Percentage',
      rate: 1.0,
      saleValue: 42500000,
      commissionAmount: 425000,
      status: 'Pending',
      notes: 'Token reservation commission for Palm Meadows Villa 22'
    }
  ];

  for (const comm of commissionDefinitions) {
    if (!comm.booking || !comm.agent) continue;
    let existing = await Commission.findOne({ booking: comm.booking, agent: comm.agent });
    if (!existing) {
      existing = await Commission.create(comm);
      stats.commissions.created++;
      console.log(`  + Created commission: ₹${existing.commissionAmount} (${existing.status})`);
    } else {
      stats.commissions.existing++;
    }
  }

  // -------------------------------------------------------------
  // 10. FINANCIAL TRANSACTIONS (General Ledger / Accounts)
  // -------------------------------------------------------------
  console.log('\n--- 10. Seeding Financial Ledger Transactions ---');
  const transactionDefinitions = [
    // Incomes
    {
      transactionNumber: 'DEMO-TXN-INC-001',
      type: 'INCOME',
      category: 'Booking Collection',
      amount: 3500000,
      booking: bk1?._id,
      accountType: 'Bank Account',
      referenceNumber: 'HDFC-NEFT-1029481',
      transactionDate: yesterday,
      description: 'Slab milestone payment for Silicon Heights Unit B-1201',
      recordedBy: accountant._id
    },
    {
      transactionNumber: 'DEMO-TXN-INC-002',
      type: 'INCOME',
      category: 'Booking Collection',
      amount: 20000000,
      booking: bookingMap['DEMO-BK-2026-002']?._id,
      accountType: 'Bank Account',
      referenceNumber: 'ICICI-RTGS-891024',
      transactionDate: twoDaysAgo,
      description: 'Final possession settlement for Palm Meadows Villa 08',
      recordedBy: accountant._id
    },
    {
      transactionNumber: 'DEMO-TXN-INC-003',
      type: 'INCOME',
      category: 'Token Advance',
      amount: 2000000,
      booking: bookingMap['DEMO-BK-2026-003']?._id,
      accountType: 'Bank Account',
      referenceNumber: 'KOTAK-RTGS-789012',
      transactionDate: yesterday,
      description: 'Token advance for Horizon Towers Penthouse B-2801',
      recordedBy: accountant._id
    },
    {
      transactionNumber: 'DEMO-TXN-INC-004',
      type: 'INCOME',
      category: 'Booking Collection',
      amount: 4500000,
      booking: bookingMap['DEMO-BK-2026-003']?._id,
      accountType: 'Bank Account',
      referenceNumber: 'KOTAK-RTGS-901245',
      transactionDate: now,
      description: 'Allotment installment for Horizon Towers Penthouse B-2801',
      recordedBy: accountant._id
    },

    // Expenses
    {
      transactionNumber: 'DEMO-TXN-EXP-001',
      type: 'EXPENSE',
      category: 'Brokerage Payout',
      amount: 380000,
      accountType: 'Bank Account',
      referenceNumber: 'HDFC-RTGS-982103',
      transactionDate: yesterday,
      description: 'Commission disbursement to Ananya Patel for Palm Meadows Villa 08',
      recordedBy: accountant._id
    },
    {
      transactionNumber: 'DEMO-TXN-EXP-002',
      type: 'EXPENSE',
      category: 'Marketing & Ads',
      amount: 250000,
      accountType: 'Bank Account',
      referenceNumber: 'BILL-META-OCT26',
      transactionDate: twoDaysAgo,
      description: 'Digital lead generation campaigns on Google & Meta Ads for Q3',
      recordedBy: accountant._id
    },
    {
      transactionNumber: 'DEMO-TXN-EXP-003',
      type: 'EXPENSE',
      category: 'Site Maintenance',
      amount: 120000,
      accountType: 'Bank Account',
      referenceNumber: 'CHQ-MAINT-8912',
      transactionDate: yesterday,
      description: 'Landscaping, horticulture & 24/7 security vendor payout for Palm Meadows',
      recordedBy: accountant._id
    },
    {
      transactionNumber: 'DEMO-TXN-EXP-004',
      type: 'EXPENSE',
      category: 'Legal & Registration',
      amount: 85000,
      accountType: 'Bank Account',
      referenceNumber: 'INV-LEGAL-789',
      transactionDate: twoDaysAgo,
      description: 'Advocate title deed verification and stamp advisory fees',
      recordedBy: accountant._id
    },
    {
      transactionNumber: 'DEMO-TXN-EXP-005',
      type: 'EXPENSE',
      category: 'Office Operations',
      amount: 175000,
      accountType: 'Bank Account',
      referenceNumber: 'INV-OPS-1092',
      transactionDate: now,
      description: 'Corporate head office IT subscriptions, high-speed fiber & utilities',
      recordedBy: accountant._id
    }
  ];

  for (const txn of transactionDefinitions) {
    let existing = await Transaction.findOne({ transactionNumber: txn.transactionNumber });
    if (!existing) {
      existing = await Transaction.create(txn);
      stats.transactions.created++;
      console.log(`  + Created transaction: ${existing.transactionNumber} (${existing.type} - ₹${existing.amount})`);
    } else {
      stats.transactions.existing++;
    }
  }

  // -------------------------------------------------------------
  // 11. CALL LOGS (Today & Recent calls for Telecallers & Dashboard)
  // -------------------------------------------------------------
  console.log('\n--- 11. Seeding Call Logs ---');
  const leadKarthik = leadMap['demo.karthik.n@wipro.com'];
  const leadPooja = leadMap['demo.pooja.bansal@biotech.in'];
  const leadVikram = leadMap['demo.vikram.singhania@fintech.co'];
  const leadSmita = leadMap['demo.smita.d@cloudservices.com'];
  const leadTanvi = leadMap['demo.tanvi.a@consulting.com'];
  const leadGeeta = leadMap['demo.geeta.k@hotmail.com'];
  const leadFarhan = leadMap['demo.farhan.q@freight.com'];

  const callLogDefinitions = [
    // Today's calls (Crucial for Dashboard "Today Calls" KPI)
    {
      lead: leadKarthik?._id,
      telecaller: telecaller._id,
      callOutcome: 'Interested',
      temperature: 'Warm',
      notes: 'Explained Silicon Heights 2BHK pricing and payment schedules. Sent brochure.',
      callDurationSeconds: 245,
      createdAt: now
    },
    {
      lead: leadPooja?._id,
      telecaller: salesExec1._id,
      callOutcome: 'Connected',
      temperature: 'Hot',
      notes: 'Confirmed loan sanction letter with HDFC. Scheduled site visit for tomorrow 11 AM.',
      callDurationSeconds: 310,
      createdAt: now
    },
    {
      lead: leadSmita?._id,
      telecaller: telecaller._id,
      callOutcome: 'Connected',
      temperature: 'Warm',
      notes: 'Fresh portal inquiry qualified. Wants North-facing 2BHK unit.',
      callDurationSeconds: 180,
      createdAt: now
    },
    {
      lead: leadTanvi?._id,
      telecaller: salesExec1._id,
      callOutcome: 'Interested',
      temperature: 'Warm',
      notes: 'Followed up on payment schedule. Client reviewing 20-80 construction linked scheme.',
      callDurationSeconds: 290,
      createdAt: now
    },
    {
      lead: leadGeeta?._id,
      telecaller: telecaller._id,
      callOutcome: 'RNT',
      temperature: 'RNT',
      notes: 'Phone rang for 45 seconds without answer. System scheduled retry tomorrow.',
      callDurationSeconds: 45,
      createdAt: now
    },
    // Past calls
    {
      lead: leadVikram?._id,
      telecaller: salesManager._id,
      callOutcome: 'Interested',
      temperature: 'Hot',
      notes: 'Discussed Mumbai Horizon Sky penthouse specifications and floor plans.',
      callDurationSeconds: 420,
      createdAt: yesterday
    },
    {
      lead: leadFarhan?._id,
      telecaller: telecaller._id,
      callOutcome: 'Switched Off',
      temperature: 'SwitchedOff',
      notes: 'Client mobile unreachable. Flagged switched off status.',
      callDurationSeconds: 0,
      createdAt: yesterday
    }
  ];

  for (const cl of callLogDefinitions) {
    if (!cl.lead) continue;
    let existing = await CallLog.findOne({ lead: cl.lead, notes: cl.notes });
    if (!existing) {
      existing = await CallLog.create(cl);
      stats.callLogs.created++;
      console.log(`  + Created call log: ${cl.callOutcome} (${cl.callDurationSeconds}s)`);
    } else {
      stats.callLogs.existing++;
    }
  }

  // -------------------------------------------------------------
  // 12. FOLLOW-UPS (Due today and upcoming for Dashboard)
  // -------------------------------------------------------------
  console.log('\n--- 12. Seeding Follow-ups ---');
  const followUpDefinitions = [
    // Due today / Pending (Crucial for Dashboard Pending Followups KPI)
    {
      lead: leadTanvi?._id,
      assignedTo: salesExec1._id,
      scheduledDate: now,
      status: 'Pending',
      priority: 'High',
      notes: 'Call back regarding construction linked payment plan details for Silicon Heights 3BHK.'
    },
    {
      lead: leadSmita?._id,
      assignedTo: telecaller._id,
      scheduledDate: now,
      status: 'Pending',
      priority: 'Medium',
      notes: 'Follow up on WhatsApp brochure sent for Whitefield 2BHK inquiry.'
    },
    {
      lead: leadKarthik?._id,
      assignedTo: telecaller._id,
      scheduledDate: now,
      status: 'Pending',
      priority: 'Medium',
      notes: 'Discuss site visit availability for this weekend.'
    },
    // Upcoming
    {
      lead: leadPooja?._id,
      assignedTo: salesExec1._id,
      scheduledDate: tomorrow,
      status: 'Pending',
      priority: 'High',
      notes: 'Reconfirm morning site visit transport and gate pass.'
    },
    {
      lead: leadGeeta?._id,
      assignedTo: telecaller._id,
      scheduledDate: tomorrow,
      status: 'Pending',
      priority: 'Low',
      notes: 'Second retry callback attempt for RNT prospect.'
    },
    // Completed
    {
      lead: leadVikram?._id,
      assignedTo: salesManager._id,
      scheduledDate: yesterday,
      status: 'Completed',
      priority: 'High',
      completedAt: yesterday,
      outcome: 'Client confirmed strong interest in 3BHK high floor unit.',
      notes: 'Initial callback completed after web inquiry.'
    }
  ];

  for (const fu of followUpDefinitions) {
    if (!fu.lead) continue;
    let existing = await FollowUp.findOne({ lead: fu.lead, notes: fu.notes });
    if (!existing) {
      existing = await FollowUp.create(fu);
      stats.followUps.created++;
      console.log(`  + Created follow-up: ${fu.status} (${fu.priority} priority - due ${fu.scheduledDate.toLocaleDateString()})`);
    } else {
      stats.followUps.existing++;
    }
  }

  // -------------------------------------------------------------
  // 13. MEETINGS (Scheduled today/tomorrow & completed)
  // -------------------------------------------------------------
  console.log('\n--- 13. Seeding Meetings ---');
  const meetingDefinitions = [
    {
      title: 'Commercial Lease Term Discussion - Cyber Park Wing C',
      customer: custAmitav?._id,
      project: projectMap['DEMO-KCP-04']?._id,
      assignedEmployee: salesExec1._id,
      meetingType: 'Office Meeting',
      scheduledDate: tomorrow,
      time: '03:30 PM',
      location: 'Conference Room Alpha, KODBRAND Head Office',
      status: 'Scheduled',
      notes: 'Meeting with Mr. Amitav Sen to finalize 5-year lock-in terms on Cyber Park floor 8.'
    },
    {
      title: 'Design Customization Walkthrough - Horizon Towers Penthouse',
      customer: custRadhika?._id,
      project: projectMap['DEMO-KHT-03']?._id,
      assignedEmployee: salesManager._id,
      meetingType: 'Online (Google Meet/Zoom)',
      scheduledDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      time: '05:00 PM',
      location: 'Google Meet (https://meet.google.com/kod-penthouse)',
      status: 'Scheduled',
      notes: 'Walkthrough with architect on private terrace deck layouts.'
    },
    {
      title: 'Allotment & Final Deed Review - Palm Meadows Villa 08',
      customer: custMenon?._id,
      project: projectMap['DEMO-KPM-02']?._id,
      assignedEmployee: salesExec2._id,
      meetingType: 'Office Meeting',
      scheduledDate: twoDaysAgo,
      time: '11:00 AM',
      location: 'Executive Boardroom, KODBRAND Head Office',
      status: 'Completed',
      notes: 'Deed registration documents executed in presence of legal counsel.',
      outcomeFeedback: 'Deed signed and registered. Key handover scheduled.'
    }
  ];

  for (const m of meetingDefinitions) {
    let existing = await Meeting.findOne({ title: m.title });
    if (!existing) {
      existing = await Meeting.create(m);
      stats.meetings.created++;
      console.log(`  + Created meeting: ${existing.title} (${existing.status})`);
    } else {
      stats.meetings.existing++;
    }
  }

  // -------------------------------------------------------------
  // 14. SITE VISITS (Upcoming and completed)
  // -------------------------------------------------------------
  console.log('\n--- 14. Seeding Site Visits ---');
  const siteVisitDefinitions = [
    {
      lead: leadPooja?._id,
      project: projectMap['DEMO-KSH-01']?._id,
      property: propertyMap['DEMO-KSH-A-704']?._id,
      assignedExecutive: salesExec1._id,
      visitDate: tomorrow,
      visitTime: '11:30 AM',
      pickupRequired: true,
      pickupLocation: 'Whitefield Club, Inner Circle Road',
      visitorsCount: 2,
      status: 'Scheduled',
      interestRating: 'Very High',
      nextActionPlan: 'Present sample flat and clubhouse amenities'
    },
    {
      customer: custRaghavan?._id,
      project: projectMap['DEMO-KSH-01']?._id,
      property: propertyMap['DEMO-KSH-A-704']?._id,
      assignedExecutive: salesExec2._id,
      visitDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      visitTime: '02:00 PM',
      pickupRequired: false,
      visitorsCount: 3,
      status: 'Scheduled',
      interestRating: 'High',
      nextActionPlan: 'Inspect 7th floor corner balcony facing park'
    },
    {
      customer: custSandeep?._id,
      project: projectMap['DEMO-KSH-01']?._id,
      property: propertyMap['DEMO-KSH-B-1201']?._id,
      assignedExecutive: salesExec1._id,
      visitDate: yesterday,
      visitTime: '10:00 AM',
      pickupRequired: false,
      visitorsCount: 2,
      status: 'Completed',
      interestRating: 'Very High',
      feedback: 'Client thoroughly impressed with lake-facing orientation and structural quality.',
      nextActionPlan: 'Proceeded immediately to booking token confirmation.'
    }
  ];

  for (const sv of siteVisitDefinitions) {
    if (!sv.project) continue;
    let existing = await SiteVisit.findOne({
      project: sv.project,
      visitTime: sv.visitTime,
      assignedExecutive: sv.assignedExecutive
    });
    if (!existing) {
      existing = await SiteVisit.create(sv);
      stats.siteVisits.created++;
      console.log(`  + Created site visit: ${sv.visitTime} (${sv.status} - Rating: ${sv.interestRating})`);
    } else {
      stats.siteVisits.existing++;
    }
  }

  // -------------------------------------------------------------
  // 15. NOTIFICATIONS
  // -------------------------------------------------------------
  console.log('\n--- 15. Seeding Notifications ---');
  const notificationDefinitions = [
    {
      recipient: superAdmin._id,
      title: 'High-Value Booking Confirmed',
      message: 'Booking BK-2026-003 for Radhika Merchant (₹4.20 Cr) has been recorded in Horizon Towers.',
      type: 'booking',
      link: '/bookings',
      isRead: false
    },
    {
      recipient: superAdmin._id,
      title: 'Milestone Collection Cleared',
      message: 'Payment of ₹35,00,000 via RTGS for Silicon Heights Unit B-1201 has been credited.',
      type: 'payment',
      link: '/payments',
      isRead: false
    },
    {
      recipient: superAdmin._id,
      title: 'New High-Priority Lead Intake',
      message: 'Vikram Singhania (VP Fintech, Budget ₹3 Cr) registered interest via Google Ads.',
      type: 'assignment',
      link: '/leads',
      isRead: true
    },
    {
      recipient: salesExec1._id,
      title: 'Pending Callback Reminder Due Today',
      message: 'Follow-up due today with Tanvi Agarwal regarding construction payment schedule.',
      type: 'followup',
      link: '/followups',
      isRead: false
    },
    {
      recipient: salesExec2._id,
      title: 'Site Visit Confirmed for Tomorrow',
      message: 'Pooja Bansal confirmed site tour at Silicon Heights tomorrow at 11:30 AM.',
      type: 'site_visit',
      link: '/site-visits',
      isRead: false
    },
    {
      recipient: accountant._id,
      title: 'Commission Payout Approved',
      message: 'Commission of ₹3,80,000 for Ananya Patel (Booking BK-002) is ready for disbursement.',
      type: 'system',
      link: '/commissions',
      isRead: true
    }
  ];

  for (const n of notificationDefinitions) {
    let existing = await Notification.findOne({
      recipient: n.recipient,
      title: n.title
    });
    if (!existing) {
      existing = await Notification.create(n);
      stats.notifications.created++;
      console.log(`  + Created notification: "${n.title}"`);
    } else {
      stats.notifications.existing++;
    }
  }

  console.log('\n======================================================');
  console.log('DEMO DATA SEEDING COMPLETE - SUMMARY:');
  console.log('======================================================');
  for (const [moduleName, counts] of Object.entries(stats)) {
    console.log(`  ${moduleName.padEnd(18)}: Created: ${counts.created}, Already Existed: ${counts.existing}`);
  }

  await mongoose.disconnect();
  console.log('Disconnected from database.');
  return stats;
}

if (process.argv[1] && process.argv[1].endsWith('seedDemoData.js')) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
