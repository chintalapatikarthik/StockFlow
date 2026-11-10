# StockFlow – Production Deployment Guide

This document provides step-by-step instructions for deploying StockFlow across the mandatory production technology stack:
- **Database**: TiDB Cloud (Serverless MySQL-compatible Starter)
- **Backend API**: Render (Web Service)
- **Frontend SPA**: Vercel (Production Static Build)
- **Source Code**: GitHub (`https://github.com/chintalapatikarthik/StockFlow`)

---

## 1. Cloud Database Setup (TiDB Cloud)

TiDB Cloud provides a fully managed, MySQL 8.0-compatible serverless database tier with built-in TLS encryption.

### Steps:
1. Log in to [TiDB Cloud](https://tidbcloud.com/).
2. Create a new **Serverless** cluster named `stockflow-db`.
3. In the cluster overview, click **Connect**:
   - Choose connection type: **General**
   - Note the connection host: e.g. `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
   - Port: `4000`
   - User: e.g. `<username>.root`
   - Generate / copy password
   - Target database: `stockflow`
4. Connect via MySQL Client or DBeaver to initialize the database:
   ```bash
   mysql -h <tidb_host> -P 4000 -u <user> -p --ssl-mode=VERIFY_IDENTITY
   ```
5. Run the schema script `backend/database.sql` to create `organizations`, `users`, and `products`.

---

## 2. Backend Deployment (Render)

Render hosts the Node.js / Express REST API with HTTPS enabled automatically.

### Steps:
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository: `https://github.com/chintalapatikarthik/StockFlow`.
4. Configure service settings:
   - **Name**: `stockflow-backend`
   - **Region**: Choose the region closest to your TiDB cluster (e.g. Frankfurt, Oregon, Singapore).
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or Starter)

### Environment Variables on Render:
Set the following environment variables in the Render **Environment** tab:

| Variable Name | Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Port automatically assigned by Render |
| `DB_HOST` | `<tidb_host>` | TiDB Cloud Gateway Host |
| `DB_PORT` | `4000` | TiDB Cloud Port (usually 4000) |
| `DB_USER` | `<tidb_user>` | Database user account |
| `DB_PASSWORD` | `<tidb_password>` | Database password |
| `DB_NAME` | `stockflow` | Database name |
| `DB_SSL` | `true` | Enables TLS connection to TiDB Cloud |
| `JWT_SECRET` | `<your-long-secure-random-secret>` | Key for signing JWTs |
| `FRONTEND_URL` | `https://your-stockflow-app.vercel.app` | Allowed CORS origin |

### Health Check Endpoint:
- Set Health Check Path to: `/api/health`
- Render uses this path to confirm successful zero-downtime deployments.

### Automatic Migration & Seeding:
On startup, `backend/server.js` automatically runs database migrations (`migrate.js`) to ensure all tables exist.
To seed the initial demonstration account and products on the production database, trigger the seed script once via Render Shell:
```bash
npm run seed
```

---

## 3. Frontend Deployment (Vercel)

Vercel provides edge hosting and global CDN distribution for the React Vite SPA.

### Steps:
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** &rarr; **Project**.
3. Import the official GitHub repository: `chintalapatikarthik/StockFlow`.
4. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Environment Variables on Vercel:
Add the following variable in the **Environment Variables** section:

| Variable Name | Value | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://stockflow-backend.onrender.com/api` | Points frontend Axios to Render backend |

*(Important: Replace `https://stockflow-backend.onrender.com` with your exact deployed Render Web Service URL).*

5. Click **Deploy**.

### SPA Route Rewrites:
The repository includes `frontend/vercel.json` configured with:
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
This ensures direct browser navigation or hard page refreshes on `/dashboard`, `/products`, and `/settings` route directly to the React application without returning 404 errors.

---

## 4. Verification Checklist

After deploying both services, run the following verification checks:

1. **Backend Health**:
   - Open `https://<your-render-url>/api/health`
   - Confirm JSON response: `{"status":"healthy","database":"connected"}`
2. **Frontend Accessibility**:
   - Open `https://<your-vercel-url>`
   - Verify redirect to `/login` with clean modern styling.
3. **Demo Login**:
   - Click **Fill Demo** button &rarr; click **Sign In**.
   - Verify dashboard loads with 4 products, 86 total stock units, and 2 low-stock alerts.
4. **Product Actions**:
   - Create a test item & verify it appears in the list.
   - Adjust stock quantity (+ / -) & confirm immediate update.
   - Edit prices & verify changes persist.
   - Delete test item.
5. **Settings & Thresholds**:
   - Go to Settings &rarr; adjust default threshold &rarr; save.
   - Verify changes reflect on dashboard metrics.
6. **Multi-Tenancy Isolation**:
   - Sign up a second tenant account & verify they see an empty product list and zero access to demo products.

---

## 5. Troubleshooting

- **CORS Errors**: Ensure `FRONTEND_URL` on Render matches your exact Vercel URL (e.g. `https://stockflow-mvp.vercel.app` without a trailing slash). The backend CORS middleware also supports `.vercel.app` preview domains automatically.
- **TiDB Cloud Connection Timeout**: Ensure `DB_SSL=true` is set and the TiDB cluster IP whitelist allows `0.0.0.0/0` (standard for serverless backends like Render).
- **Page Refresh 404 on Vercel**: Ensure `frontend/vercel.json` is present in the repository and the root directory in Vercel project settings is set to `frontend`.
