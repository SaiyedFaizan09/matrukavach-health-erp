# MatruKavach (માતૃકવચ) — Rural Maternal Healthcare ERP

> **A production-grade, clinical enterprise resource planning (ERP) platform engineered for Primary Health Centres (PHCs), Sub-Centres, and outreach village camps.**  

Built to eliminate preventable maternal mortality by unifying point-of-care clinical triage, maternal kit inventory reconciliation, real-time emergency transit, and automated block-level HMIS consolidation.

## 📚 Documentation Index

To keep this guide clean and focused on getting you up and running, detailed system specifications have been separated into dedicated documents. **Please refer to these files to understand how MatruKavach works under the hood:**

- 🏗️ **[System Architecture & Modules](./docs/ARCHITECTURE.md)**: Problem statement, Tech Stack, User Roles (RBAC), Clinical Decision Support System (CDSS), and Data Schemas.
- 🔌 **[REST API Reference](./docs/API_REFERENCE.md)**: Complete backend endpoint documentation, authentication, and request payloads.
- 📸 **[Application Screenshots](./screenshots/README.md)**: Visual walkthrough of the UI, daily camp workspace, and reporting modules.

---

## 🚀 Setup & Installation Guide

Follow these steps to get MatruKavach cloned, configured, seeded, and running on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js**: Version `18.0.0` or higher.
- **MongoDB**: Local Community Server (running on `mongodb://127.0.0.1:27017`) or a MongoDB Atlas cloud URI.
- **Git**: To clone the repository.

### 2. Clone the Repository
```bash
git clone https://github.com/your-org/matrukavach-health-erp.git
cd matrukavach-health-erp
```

### 3. Install Dependencies
Run the orchestrator script to install dependencies for the root, backend, and frontend simultaneously:
```bash
npm run install:all
```

### 4. Configure Environment Variables
**Backend (`backend/.env`)**
Copy the example file and update it:
```bash
cp backend/.env.example backend/.env
```
Ensure it contains:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/matrukavach_db
PORT=5000
JWT_SECRET=super_secret_matrukavach_production_key_2026
FRONTEND_ORIGIN=http://localhost:5173
```

**Frontend (`frontend/.env`)**
Copy the example file:
```bash
cp frontend/.env.example frontend/.env
```
Ensure it contains:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 5. Seed the Database (Mock Scenarios)
Populate your local database with 15 realistic rural antenatal beneficiaries, staff accounts, stock ledgers, and transit logs to immediately test the system:
```bash
npm run seed
```

### 6. Launch the Application
Start both the Node.js API backend and the Vite frontend simultaneously:
```bash
npm run dev
```
- The API will run at `http://localhost:5000/api/health`
- The Web App will be accessible at `http://localhost:5173`

---

## 🔑 Demo Accounts & Credentials

Use these pre-seeded accounts to explore the Role-Based Access Control (RBAC).  
**Master Password for all accounts:** `Password@123`

| Email | Role | Scope to Test |
| :--- | :--- | :--- |
| **`admin@block.gov.in`** | **Block Admin** | Staff management, block-wide HMIS audit, **unlocking** camp sheets. |
| **`meena@phc.gov.in`** | **Medical Officer**| High-risk triage review, 108 dispatch, **locking** daily sheets. |
| **`kavita@phc.gov.in`** | **ANM Nurse** | Point-of-care screenings, physical kit ledger, WhatsApp cards. |
| **`rekha@phc.gov.in`** | **ASHA Worker** | Village-scoped EDD radar, home follow-up tracking. |

---

## 🛠️ Troubleshooting & FAQs

**Q: `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`**
* **Fix**: Your local MongoDB service is not running. Start it via `services.msc` (Windows) or `brew services start mongodb-community` (Mac). Alternatively, use a MongoDB Atlas URI in `backend/.env`.

**Q: `CORS error` or `Network Error` in browser console**
* **Fix**: Ensure the backend is active at `localhost:5000` and `FRONTEND_ORIGIN` matches the Vite URL (`http://localhost:5173`) in your backend `.env`.

**Q: Error: Camp sheet is locked by Medical Officer (Status 423)**
* **Fix**: Log in with the **Block Admin** account (`admin@block.gov.in`) and click **Unlock Sheet** to allow edits.

---
*Built to align with India's National Health Mission (NHM) and Ayushman Bharat Digital Mission (ABDM) standards.*
