# KODBRAND Enterprise Real Estate CRM — Role-Based Access Control (RBAC) Matrix

## 1. Role Hierarchy & Principles

The CRM enforces strict Principle of Least Privilege across all API endpoints and frontend navigation elements. The platform supports 7 predefined roles:

1. **`super_admin`**: Full unrestricted system control, administrative override, user deactivations, and settings management.
2. **`admin`**: Full operational access across all business modules, inventory, staff, and financial ledgers.
3. **`sales_manager`**: Lead assignment, discount approvals up to policy threshold, deal pipeline oversight, commission approval.
4. **`sales_executive`**: Manages assigned leads, executes property site visits, closes opportunities, and creates unit reservations.
5. **`telecaller`**: Focuses on outbound phone campaigns, call outcome logging, follow-up callbacks, and preliminary lead qualification.
6. **`accountant`**: Financial voucher processing, payment recording against bookings, official receipt generation, and general ledger reconciliation.
7. **`guest`**: Read-only evaluation view for external auditors or stakeholders.

---

## 2. Comprehensive RBAC Permissions Matrix

| Module / Operation | Super Admin | Admin | Sales Manager | Sales Executive | Telecaller | Accountant | Guest |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Auth & Profile** |
| Login & View Me | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change Own Password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard** |
| View Executive KPIs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Pipeline Metrics | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Telecaller Metrics | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Leads** |
| View All Leads | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Assigned Leads | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Lead | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Lead Details | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reassign Lead | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bulk Import / Export | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Telecaller & Calls** |
| View Call Logs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Log Call & Outcome | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Daily Call Queue | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Schedule Follow-ups | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Meetings & Visits** |
| Schedule Meetings | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update Meeting Status | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Book Site Visit | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Record Tour Feedback | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Projects & Inventory** |
| Create/Edit Master Project | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Add/Update Property Units | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Unit Availability | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Block/Unblock Inventory | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Customers 360°** |
| View Customer Profile | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Create/Edit Customer KYC | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Opportunities / Kanban** |
| View Pipeline Deals | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Move Deal Stages | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bookings & Sales** |
| Create Unit Reservation | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Discounts > 5% | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Confirm Booking to Sale | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancel Booking & Release | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Payments & Receipts** |
| Record Booking Payment | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Receipts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Issue Refund | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Commissions** |
| View All Commissions | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| View Own Commission | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Commission | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Disburse Commission | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Accounts & Ledger** |
| View Ledger Transactions | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Add Ledger Adjustment | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Run Bank Reconciliation | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Reports & Analytics** |
| Access Reports Module | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Export Analytical Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **System Administration** |
| Manage Staff Users & Roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Enforcement Implementation

### 3.1 Backend Middleware Enforcement
All protected Express routes apply the `authorize` middleware:
```javascript
// server/src/middleware/authorize.js
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient privileges to perform this action.'
      });
    }
    next();
  };
};
```

### 3.2 Frontend Route & Navigation Guards
Navigation elements filter their menus dynamically against `user.role` via `client/src/constants/navigation.js`. Direct browser navigation to an unauthorized URL displays a clean access denial state without rendering protected components.
