# KODBRAND Enterprise Real Estate CRM — API Documentation

## Base URL
- **Development**: `http://localhost:5000/api`
- **Vite Proxy**: Requests from the frontend via `/api/*` are proxied to the backend at `http://localhost:5000`.

## Standard Response Format
All responses adhere to a consistent JSON envelope:

### Success Response
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Specific error description",
  "errors": []
}
```

---

## 1. Authentication & Identity (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user with email & password, returns JWT & user profile |
| `GET` | `/api/auth/me` | Authenticated | Returns currently authenticated user session details |
| `POST` | `/api/auth/logout` | Authenticated | Clears user session (client destroys stored JWT) |

#### Sample Request (`POST /api/auth/login`):
```json
{
  "email": "admin@kodbrand.com",
  "password": "Password@123"
}
```

#### Sample Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "67f6789...",
      "name": "Super Admin",
      "email": "admin@kodbrand.com",
      "role": "super_admin",
      "department": "Management"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 2. Dashboard Analytics (`/api/dashboard`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | All Authenticated | Executive KPIs (Total Leads, Active Bookings, Total Revenue, Available Units) |
| `GET` | `/api/dashboard/pipeline` | All Authenticated | Lead status breakdown, temperature counts, deals by stage |
| `GET` | `/api/dashboard/performance` | Managers / Admins | Telecaller metrics, conversion rates, monthly revenue trend |

---

## 3. Leads Management (`/api/leads`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/leads` | All Authenticated | Lists leads with search, temperature, status, and pagination |
| `POST` | `/api/leads` | All Authenticated | Creates a new lead with duplicate phone detection |
| `GET` | `/api/leads/:id` | All Authenticated | Retrieves single lead details and contact information |
| `PATCH` | `/api/leads/:id` | Agent / Manager / Admin | Updates lead fields (budget, project preference, etc.) |
| `PATCH` | `/api/leads/:id/assignment` | Manager / Admin | Assigns lead to a telecaller or sales agent |
| `PATCH` | `/api/leads/:id/status` | Agent / Manager / Admin | Updates lead status (New, Contacted, Qualified, Lost, Converted) |
| `GET` | `/api/leads/:id/history` | All Authenticated | Retrieves audit timeline of calls, status changes, and notes |
| `POST` | `/api/leads/import` | Admin / Manager | Bulk imports leads from CSV or JSON payload |
| `GET` | `/api/leads/export` | Admin / Manager | Exports filtered lead database to CSV |

#### Statuses:
`New`, `Contacted`, `Qualified`, `Visit Scheduled`, `Negotiation`, `Won`, `Lost`

#### Temperatures:
`Hot`, `Warm`, `Cold`, `RNT` (Ringing Not Transferred), `SwitchedOff`, `Call Back`

---

## 4. Telecaller Workspace & Follow-Ups (`/api/call-logs`, `/api/follow-ups`, `/api/telecallers`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/call-logs` | All Authenticated | Retrieves call history filtered by lead, telecaller, outcome |
| `POST` | `/api/call-logs` | All Authenticated | Logs a phone call attempt and automatically schedules follow-up |
| `GET` | `/api/follow-ups` | All Authenticated | Lists pending and overdue follow-up tasks |
| `POST` | `/api/follow-ups` | All Authenticated | Creates a standalone follow-up reminder |
| `PATCH` | `/api/follow-ups/:id` | All Authenticated | Completes or reschedules a follow-up task |
| `GET` | `/api/telecallers/queue` | Telecaller / Manager | Returns prioritized daily call queue for the logged-in agent |

---

## 5. Meetings (`/api/meetings`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meetings` | All Authenticated | Returns scheduled buyer meetings (Virtual, In-Office, On-Site) |
| `POST` | `/api/meetings` | All Authenticated | Schedules an appointment with lead/customer and sales executive |
| `PATCH` | `/api/meetings/:id` | All Authenticated | Updates meeting status (`Scheduled`, `Completed`, `Cancelled`, `No Show`) |

---

## 6. Site Visits (`/api/site-visits`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/site-visits` | All Authenticated | Retrieves property visit appointments with project & executive filters |
| `POST` | `/api/site-visits` | All Authenticated | Books a property tour with optional pickup logistics |
| `PATCH` | `/api/site-visits/:id` | All Authenticated | Updates status, records buyer feedback, and notes interest level |

---

## 7. Projects & Developments (`/api/projects`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | All Authenticated | Lists real estate master projects with units count & launch status |
| `POST` | `/api/projects` | Admin / Manager | Creates a new development project |
| `GET` | `/api/projects/:id` | All Authenticated | Retrieves project details and linked properties |
| `PATCH` | `/api/projects/:id` | Admin / Manager | Updates project progress, amenities, and delivery dates |

---

## 8. Properties & Inventory (`/api/properties`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/properties` | All Authenticated | Lists inventory units filtered by project, BHK type, price, status |
| `POST` | `/api/properties` | Admin / Manager | Registers a new property unit (enforces compound uniqueness) |
| `GET` | `/api/properties/:id` | All Authenticated | Retrieves unit specification, floor plans, and pricing |
| `PATCH` | `/api/properties/:id` | Admin / Manager | Modifies unit status (`Available`, `Reserved`, `Booked`, `Sold`, `Blocked`) |

---

## 9. Customer 360° Management (`/api/customers`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers` | All Authenticated | Lists registered customers with contact and booking aggregates |
| `POST` | `/api/customers` | All Authenticated | Onboards a new customer profile or converts a won lead |
| `GET` | `/api/customers/:id` | All Authenticated | Retrieves comprehensive 360° profile (bookings, payments, documents) |
| `PATCH` | `/api/customers/:id` | Agent / Manager / Admin | Updates KYC status, address, and secondary contact details |

---

## 10. Opportunities & Sales Pipeline (`/api/opportunities`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/opportunities` | All Authenticated | Retrieves sales deals for Kanban board grouped by stage |
| `POST` | `/api/opportunities` | All Authenticated | Creates a new opportunity with estimated deal value and probability |
| `PATCH` | `/api/opportunities/:id` | All Authenticated | Updates stage (`Qualification`, `Proposal`, `Negotiation`, `Closed Won`) |

---

## 11. Bookings & Reservations (`/api/bookings`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bookings` | All Authenticated | Lists all property reservations and sale contracts |
| `POST` | `/api/bookings` | Sales / Manager / Admin | Atomically reserves a unit, validates discounts, and builds schedule |
| `GET` | `/api/bookings/:id` | All Authenticated | Retrieves booking contract, unit pricing breakdown, and payment milestones |
| `PATCH` | `/api/bookings/:id/confirm` | Manager / Admin | Confirms reservation into formal sale, marks unit `Booked` |
| `PATCH` | `/api/bookings/:id/cancel` | Manager / Admin | Cancels booking, releases property back to `Available`, logs reason |

---

## 12. Payments, Receipts & Refunds (`/api/payments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payments` | All Authenticated | Lists payment receipts with booking and mode filters |
| `POST` | `/api/payments` | Accountant / Admin | Records an incoming payment against a booking; updates balances |
| `GET` | `/api/payments/:id/receipt` | All Authenticated | Retrieves official printable payment receipt |
| `POST` | `/api/payments/:id/refund` | Admin / Super Admin | Processes customer refund and posts balancing ledger entry |

---

## 13. Employees & Workload (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin / Super Admin | Lists all staff members with roles, departments, and active statuses |
| `POST` | `/api/users` | Admin / Super Admin | Creates a new employee user account |
| `PATCH` | `/api/users/:id` | Admin / Super Admin | Updates employee profile or changes RBAC role |
| `DELETE` | `/api/users/:id` | Super Admin | Deactivates employee user account |

---

## 14. Commission Management (`/api/commissions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/commissions` | All Authenticated | Lists agent commissions (filtered by agent for standard staff) |
| `POST` | `/api/commissions/:id/approve` | Manager / Admin | Approves calculated commission for a closed deal |
| `POST` | `/api/commissions/:id/disburse` | Finance / Admin | Disburses payout and posts expense entry to General Ledger |

---

## 15. Accounts, General Ledger & Reconciliation (`/api/accounts`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/accounts/transactions` | Finance / Admin | Lists general ledger transactions (`Income` vs `Expense`) |
| `POST` | `/api/accounts/transactions` | Finance / Admin | Creates manual ledger adjustment or expense voucher |
| `GET` | `/api/accounts/reconciliation` | Finance / Admin | Compares booking receipts with bank statements and calculates variance |

---

## 16. Reports & Analytics (`/api/reports`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/:reportType` | Manager / Admin / Finance | Returns tabular and analytical data for reports |

#### Supported Report Types:
- `lead-source`: Conversion by marketing channel (Portal, Website, Referral, Ads).
- `temperature`: Hot vs. Warm vs. Cold distribution.
- `sales-performance`: Agent volume, closed revenue, win rates.
- `telecaller-activity`: Call volume, connect rates, scheduled visits.
- `inventory-aging`: Unit vacancy days and absorption rates.

---

## 17. In-App Notifications (`/api/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | All Authenticated | Lists notifications for the active user |
| `PATCH` | `/api/notifications/:id/read` | All Authenticated | Marks specific notification as read |
| `PATCH` | `/api/notifications/read-all` | All Authenticated | Marks all unread notifications as read |

---

## 18. Settings & Audit Logs (`/api/settings`, `/api/audit-logs`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | Admin / Super Admin | Returns company profile, tax defaults, and currency settings |
| `POST` | `/api/settings` | Super Admin | Updates system configuration |
| `GET` | `/api/audit-logs` | Admin / Super Admin | Retrieves tamper-evident historical audit entries |
