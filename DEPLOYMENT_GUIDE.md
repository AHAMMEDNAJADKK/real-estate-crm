# KODBRAND ENTERPRISE ERP — REAL ESTATE CRM
## PRODUCTION DEPLOYMENT & OPERATIONS GUIDE

This guide provides step-by-step instructions for deploying the **KODBRAND Enterprise ERP — Real Estate CRM** to **Render** (Backend), **Vercel** (Frontend), and **MongoDB Atlas** (Database).

---

## 1. PRODUCTION ARCHITECTURE OVERVIEW

```
+-------------------------------------------------------------+
|                      CLIENT BROWSER                         |
+-------------------------------------------------------------+
                              |
               HTTPS (Static Assets & React App)
                              v
+-------------------------------------------------------------+
|                  VERCEL (Frontend Host)                     |
|  - Framework: Vite + React 18                               |
|  - Root Directory: client                                   |
|  - Output Directory: dist                                   |
|  - SPA Rewrites: /.* -> /index.html                         |
+-------------------------------------------------------------+
                              |
                     REST API Calls (CORS)
                              v
+-------------------------------------------------------------+
|               RENDER (Backend Web Service)                  |
|  - Runtime: Node.js 20+ (ES Modules)                        |
|  - Root Directory: server                                   |
|  - Start Command: node server.js                            |
|  - Health Check: /api/health                                |
+-------------------------------------------------------------+
                              |
                    Mongoose Connection Pool
                              v
+-------------------------------------------------------------+
|                 MONGODB ATLAS (Database)                    |
|  - Database Name: edtech_crm                                |
|  - Replica Set with TLS/SSL encryption                      |
+-------------------------------------------------------------+
```

---

## 2. DATABASE CONFIGURATION (MONGODB ATLAS)

1. **Log in to MongoDB Atlas:** Navigate to [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Create a Database User:**
   - Under **Database Access**, create a user with `Read and write to any database` privileges.
   - Note the username and strong generated password.
3. **Configure Network Whitelist:**
   - Under **Network Access**, click **Add IP Address**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) to permit Render dynamic IP instances to connect.
4. **Retrieve Connection String:**
   - Click **Connect** > **Drivers** (Node.js).
   - Format the connection URI to target the designated database `edtech_crm`:
   ```text
   mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/edtech_crm?retryWrites=true&w=majority
   ```

---

## 3. BACKEND DEPLOYMENT (RENDER WEB SERVICE)

### Option A: Using Render Blueprint (`render.yaml`)
A ready-to-deploy `render.yaml` file is included in the repository root:
1. Navigate to the **Render Dashboard** > **Blueprints**.
2. Click **New Blueprint Instance**.
3. Select the repository: `https://github.com/AHAMMEDNAJADKK/real-estate-crm.git`.
4. Render will automatically detect `render.yaml` and configure the web service.
5. Provide the `MONGODB_URI` and `JWT_SECRET` when prompted.

### Option B: Manual Web Service Setup
1. In the **Render Dashboard**, click **New +** > **Web Service**.
2. Connect your GitHub repository: `https://github.com/AHAMMEDNAJADKK/real-estate-crm.git`.
3. Configure the service settings:
   - **Name:** `kodbrand-realestate-crm-api`
   - **Region:** Singapore / Frankfurt / Oregon (nearest to target audience)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free` or `Starter`
4. Configure **Health Check Path:**
   - Set to `/api/health`
5. Configure **Environment Variables** in Render Dashboard:

| Variable Name | Required | Recommended Production Value | Description |
|---------------|----------|------------------------------|-------------|
| `NODE_ENV` | Yes | `production` | Enables production optimizations |
| `PORT` | Yes | `10000` | Auto-provided by Render; backend binds to `0.0.0.0` |
| `MONGODB_URI` | Yes | `mongodb+srv://<user>:<pwd>@<cluster>.mongodb.net/edtech_crm?retryWrites=true&w=majority` | Production MongoDB Atlas URI pointing to `edtech_crm` |
| `JWT_SECRET` | Yes | `<Generate a 64-char random hex string>` | Secret used to sign HMAC-SHA256 user authentication tokens |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token lifetime (defaults to 7d) |
| `ALLOWED_ORIGINS` | Yes | `https://your-frontend.vercel.app,http://localhost:5173` | Comma-delimited list of authorized frontend origins |

6. Click **Deploy Web Service** and note your Render backend URL (e.g., `https://kodbrand-realestate-crm-api.onrender.com`).

---

## 4. FRONTEND DEPLOYMENT (VERCEL)

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import the repository: `https://github.com/AHAMMEDNAJADKK/real-estate-crm.git`.
4. In the Project Configuration screen:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `client`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
   - **Install Command:** `npm install` (default)
5. Add **Environment Variables**:

| Variable Name | Required | Example Production Value | Description |
|---------------|----------|--------------------------|-------------|
| `VITE_API_URL` | Yes | `https://kodbrand-realestate-crm-api.onrender.com/api` | Full URL to the Render backend `/api` endpoint |

6. Click **Deploy**. Vercel will build the frontend and assign a production URL (e.g., `https://realestate-crm-xxx.vercel.app`).
7. **Important Post-Deploy Step:** Copy your Vercel URL and update the `ALLOWED_ORIGINS` variable on Render to ensure CORS authorization.

---

## 5. SINGLE-PAGE APPLICATION (SPA) REWRITES

To prevent HTTP 404 errors when refreshing routes such as `/leads`, `/properties`, or `/dashboard`:
- `client/vercel.json` is pre-configured with:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
- A root `vercel.json` is also provided in case Vercel is deployed from the repository root.

---

## 6. POST-DEPLOYMENT SMOKE TEST CHECKLIST

Run this automated smoke verification after deploying both services:

### Step 1: Verify Backend Health Check
```bash
curl -I https://kodbrand-realestate-crm-api.onrender.com/api/health
```
*Expected Output:* `HTTP/1.1 200 OK` with JSON body:
```json
{"status":"healthy","service":"KODBRAND Real Estate CRM Backend"}
```

### Step 2: Verify Root API Endpoint
```bash
curl https://kodbrand-realestate-crm-api.onrender.com/
```
*Expected Output:* `HTTP/1.1 200 OK` with JSON body identifying the service.

### Step 3: Test Administrative User Login
```bash
curl -X POST https://kodbrand-realestate-crm-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@kodbrand.com\",\"password\":\"Admin@123\"}"
```
*Expected Output:* `HTTP/1.1 200 OK` containing a valid JWT `token` and user profile object.

### Step 4: Verify Frontend Access & Navigation
1. Open the Vercel URL in an incognito window.
2. Confirm the dark navy KODBRAND branding, purple accents, and responsive layout load properly.
3. Log in using authorized credentials.
4. Verify that the 15 navigation items in the sidebar load without blank screens.
5. Manually refresh a nested route (e.g., `/leads`) to verify the SPA rewrite functions correctly.

---

## 7. DISASTER RECOVERY & ROLLBACK PLAN

- **Backend Rollback (Render):**
  - Navigate to **Render Dashboard** > **Deployments**.
  - Identify the last known working deployment commit and click **Rollback to this revision**.
- **Frontend Rollback (Vercel):**
  - Navigate to **Vercel Dashboard** > **Deployments**.
  - Select the prior successful deployment and click **Promote to Production**.
- **Database Backup (MongoDB Atlas):**
  - Continuous cloud backups can be enabled under **Atlas Backup** tab.
  - Snapshot points allow point-in-time recovery with 1 click.
