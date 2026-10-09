# KODBRAND Enterprise Real Estate CRM & ERP

> A production-grade, full-stack MERN application for high-volume real estate developers, agencies, and brokerage networks.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Tests](https://img.shields.io/badge/Automated%20Tests-25%2F25%20Passing-success)
![React](https://img.shields.io/badge/React-19.0-blue)
![Node](https://img.shields.io/badge/Node.js-22.x-green)
![Express](https://img.shields.io/badge/Express-4.21-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-brightgreen)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38bdf8)

---

## 🌟 Key Features & 15 Business Modules

1. **Dashboard & Analytics**: Real-time sales conversion KPIs, pipeline velocity, temperature breakdowns, and executive charts.
2. **Lead Management**: Full inbound lead lifecycle tracking (`New`, `Contacted`, `Qualified`, `Visit Scheduled`, `Won`, `Lost`) with temperature classification (`Hot`, `Warm`, `Cold`, `RNT`, `SwitchedOff`, `Call Back`) and duplicate phone prevention.
3. **Telecaller Workspace & Call History**: Daily call queue assignment, call logging with call duration and outcome tracking, and automated callback scheduling.
4. **Meetings Calendar**: Virtual, in-office, and on-site buyer appointment scheduling and attendance monitoring.
5. **Site Visits & Tour Logistics**: Property visits management, client pickup logistics, driver notes, and structured tour feedback.
6. **Projects & Developments**: Master developments, towers/phases, launch milestones, and real-time total vs. available unit tracking.
7. **Properties & Units Inventory**: Real-time inventory grid with compound uniqueness (`project + tower + unitNumber`), pricing, carpet areas, and dynamic availability flags (`Available`, `Reserved`, `Booked`, `Sold`, `Blocked`).
8. **Customer 360° Profiles**: Centralized customer records aggregating past interactions, site visits, bookings, financial statements, and KYC documents.
9. **Sales Opportunities & Kanban**: Interactive deal pipeline board tracking deal stages, probability, and forecasted revenue.
10. **Bookings & Reservations**: Atomic property reservation system preventing double booking, automated milestone schedules, and role-based discount threshold approvals.
11. **Payments, Receipts & Refunds**: Financial collection recording, balance due recalculations from confirmed database records, duplicate cheque/transfer reference prevention, and official receipt vouchers.
12. **Employees & RBAC Management**: Comprehensive team administration across 7 enterprise roles (`super_admin`, `admin`, `sales_manager`, `sales_executive`, `telecaller`, `accountant`, `guest`).
13. **Commission Management**: Automatic sales commission calculations, manager approvals, disbursement logging, and financial ledger integration.
14. **Accounts & General Ledger**: Dual-entry income and expense tracking, operational cost accounting, and bank deposit reconciliation.
15. **Reports & Settings**: Multi-dimensional business reporting (marketing source, lead temperature, sales performance, agent activity) and tamper-resistant audit logs.

---

## 🛡️ Critical Concurrency & Business Safeguards

- **Atomic Property Reservation**: Uses atomic `Property.findOneAndUpdate({ _id, status: 'Available' }, { status: 'Reserved' })` to eliminate race conditions and prevent double-booking.
- **Server-Side Balance Integrity**: Payment recording recomputes balances directly from confirmed transactions in the database; client-supplied balances are never trusted.
- **Duplicate Payment Protection**: Enforces unique indexes on `transactionReference` to block accidental double charges or duplicate voucher submissions.
- **Discount Authorization Policy**: Discounts greater than 5% require approval from a `sales_manager`, `admin`, or `super_admin`.
- **Automatic Ledger Posting**: Booking payments post income entries to the General Ledger; commission disbursements post expense entries.

---

## 📂 Repository Structure

```text
real-estate-crm/
├── client/                     # Frontend Application (React 19 + Vite 8 + Tailwind CSS v4)
│   ├── src/
│   │   ├── app/                # App router, providers, and layout wiring
│   │   ├── components/         # Common atomic UI components (DataTable, Modal, Badge, etc.)
│   │   ├── context/            # AuthContext and ToastContext
│   │   ├── pages/              # 15 domain pages + Auth views
│   │   ├── services/           # Axios API client & typed domain services
│   │   └── styles/             # Global Tailwind styling with KODBRAND corporate palette
│   ├── vite.config.js          # Vite config with backend proxy
│   └── package.json
│
├── server/                     # Backend Application (Node.js + Express + Mongoose)
│   ├── src/
│   │   ├── config/             # DB connector & environment configuration
│   │   ├── middleware/         # Auth (JWT), RBAC guard, error handler, Multer uploads
│   │   ├── models/             # 18 Mongoose models with strict schema constraints & indexes
│   │   ├── modules/            # 15 domain modules (routes, controllers, services)
│   │   ├── utils/              # Standard response formatters and logger
│   │   ├── app.js              # Express app definition
│   │   └── server.js           # Bootstrap script with auto-seeding
│   ├── tests/                  # 25 automated unit, integration, and workflow tests
│   └── package.json
│
├── docs/                       # Project Documentation
│   ├── architecture.md         # System architecture & design patterns
│   ├── api-documentation.md    # REST API endpoints & payload specifications
│   ├── database-schema.md      # 18 Mongoose models, relations & index definitions
│   ├── permissions.md          # RBAC matrix across 7 enterprise roles
│   ├── setup.md                # Development, build, and deployment guide
│   └── testing-report.md       # Automated testing suite summary & results
│
├── package.json                # Root monorepo configuration
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v20.x` or `v22.x`
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

### 1. Installation
Install dependencies across both client and server:
```bash
npm run install:all
```

### 2. Environment Configuration
Verify `server/.env` and `client/.env`:
```env
# server/.env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/realestate_crm
JWT_SECRET=super_secret_jwt_key_kodbrand_enterprise_2026
CORS_ORIGIN=http://localhost:5173

# client/.env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Servers
Start both backend (port 5000) and frontend (port 5173):
```bash
npm run dev
```

### 4. Default Seed Credentials
The backend seeds an administrator account upon initial startup:
- **Email**: `admin@kodbrand.com`
- **Password**: `Password@123`
- **Role**: `super_admin`

---

## 🧪 Automated Testing

Run the test suite from `server/`:
```bash
cd server
npm test
```

### Test Results Summary:
- **Unit Tests (`tests/unit/models.test.js`)**: 4/4 Passed
- **Integration Tests (`tests/integration/auth_rbac.test.js`)**: 6/6 Passed
- **Integration Tests (`tests/integration/leads_telecaller.test.js`)**: 5/5 Passed
- **Workflow Tests (`tests/workflows/booking_safeguards.test.js`)**: 6/6 Passed
- **Workflow Tests (`tests/workflows/payments_accounts.test.js`)**: 4/4 Passed
- **Total**: **25/25 Tests Passing (0 Failures)**

---

## 📦 Production Build

```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
NODE_ENV=production node src/server.js
```

---

## 📚 Documentation Catalog

For detailed documentation, refer to the [docs/](file:///c:/Users/LAPY%20HUB/Desktop/realestate-crm/docs/) folder:
- [Architecture Guide](file:///c:/Users/LAPY%20HUB/Desktop/realestate-crm/docs/architecture.md)
- [API Documentation](file:///c:/Users/LAPY%20HUB/Desktop/realestate-crm/docs/api-documentation.md)
- [Database Schema Guide](file:///c:/Users/LAPY%20HUB/Desktop/realestate-crm/docs/database-schema.md)
- [Permissions & RBAC Matrix](file:///c:/Users/LAPY%20HUB/Desktop/realestate-crm/docs/permissions.md)
- [Setup & Deployment Guide](file:///c:/Users/LAPY%20HUB/Desktop/realestate-crm/docs/setup.md)
- [Testing & Verification Report](file:///c:/Users/LAPY%20HUB/Desktop/realestate-crm/docs/testing-report.md)
