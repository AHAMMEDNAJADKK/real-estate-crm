# KODBRAND Enterprise Real Estate CRM — Setup & Deployment Guide

## 1. System Requirements

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm v10.x` or later
- **Database**: `MongoDB v6.0` or later (Local service running at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)
- **Operating System**: Windows 10/11, macOS, or Linux

---

## 2. Environment Variables Configuration

### 2.1 Backend Environment (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/realestate_crm
JWT_SECRET=super_secret_jwt_key_kodbrand_enterprise_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 2.2 Frontend Environment (`client/.env`)
Create `client/.env` based on `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 3. Installation & Dependency Setup

From the monorepo root:

```bash
# 1. Install root, backend, and frontend dependencies
npm run install:all
```

Alternatively, install in each workspace individually:
```bash
# Backend setup
cd server
npm install

# Frontend setup
cd ../client
npm install
```

---

## 4. Database Initialization & Seeding

The backend automatically creates database indexes and seeds the default **Super Admin** account on first startup if no administrator exists in the collection.

### Default Seed Credentials:
- **Email**: `admin@kodbrand.com`
- **Password**: `Password@123`
- **Role**: `super_admin`
- **Department**: `Management`

> [!IMPORTANT]
> Change the default super admin password immediately upon first login in a production environment.

---

## 5. Running the Application

### 5.1 Development Mode (Concurrent)
From the root workspace:
```bash
npm run dev
```
This runs both the Express API server (port 5000) and the Vite frontend dev server (port 5173) simultaneously.

### 5.2 Starting Individual Services
**Backend Server:**
```bash
cd server
npm run dev
# Express server listening at http://localhost:5000
```

**Frontend Client:**
```bash
cd client
npm run dev
# Vite server running at http://localhost:5173
```

---

## 6. Running Automated Tests

The backend includes a comprehensive automated test suite testing models, authorization guards, duplicate lead handling, booking locks, and financial reconciliation.

Run tests from `server/`:
```bash
cd server
npm test
```

Expected output:
```text
✔ Property unit compound index prevents duplicate unit (42ms)
✔ User password hashing and comparison (28ms)
✔ Lead model schema defaults and temperature validation (21ms)
✔ Booking schema calculations and constraints (19ms)
✔ Rejects login with invalid credentials (31ms)
✔ Authenticates super_admin and returns JWT token (24ms)
✔ Denies access to protected routes without JWT token (15ms)
✔ Super admin can access protected route (18ms)
✔ Telecaller role is denied access to admin-only user endpoint (22ms)
✔ Super admin can access admin-only endpoint (19ms)
✔ Leads creation and duplicate phone number validation (34ms)
✔ Lead status and temperature update (27ms)
✔ Telecaller queue lists leads assigned to telecaller (26ms)
✔ Call log creation updates lead last contacted and schedules followup (31ms)
✔ FollowUp completion marks status completed (23ms)
✔ Atomic property reservation prevents double booking (35ms)
✔ Second concurrent booking for same property is rejected (28ms)
✔ Sales executive cannot apply discount > 5% without manager role (25ms)
✔ Admin can approve booking with discount (31ms)
✔ Booking confirmation transitions status and updates property to Booked (33ms)
✔ Booking cancellation releases property back to Available (32ms)
✔ Recording payment updates booking balance due and total paid (36ms)
✔ Duplicate payment reference is rejected (29ms)
✔ Payment refund re-credits booking balance due (34ms)
✔ Bank reconciliation correctly balances receipts with general ledger (31ms)

ℹ tests 25
ℹ suites 5
ℹ pass 25
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

---

## 7. Production Build & Deployment

### 7.1 Client Build
```bash
cd client
npm run build
```
Generates an optimized static distribution in `client/dist/`.

### 7.2 Production Server Run
```bash
cd server
NODE_ENV=production node src/server.js
```
The server serves API endpoints at `/api` and file uploads at `/uploads`. In a production container, reverse-proxy `/` to the Vite static bundle in `client/dist/`.
