# MatruKavach (માતૃકવચ) — Rural Maternal Healthcare ERP

> **A production-grade, clinical enterprise resource planning (ERP) platform engineered for Primary Health Centres (PHCs), Sub-Centres, and outreach village camps.**  
> Built to eliminate preventable maternal mortality by unifying point-of-care clinical triage, maternal kit inventory reconciliation, real-time emergency transit (MMU / 108 referrals), and automated block-level HMIS consolidation under India's public health delivery frameworks (NHM, RCH, PMSMA, ABDM).

---

## Table of Contents

- [PART 1: System Definition, Architecture & Specifications](#part-1-system-definition-architecture--specifications)
  - [1. Problem Statement](#1-problem-statement)
  - [2. The MatruKavach Solution](#2-the-matrukavach-solution)
  - [3. User Roles & Personas](#3-user-roles--personas)
  - [4. Role-Based Access Control (RBAC) Matrix](#4-role-based-access-control-rbac-matrix)
  - [5. Core Modules Overview](#5-core-modules-overview)
  - [6. Clinical Decision Support System (CDSS)](#6-clinical-decision-support-system-cdss)
  - [7. Tech Stack & Architecture](#7-tech-stack--architecture)
  - [8. Codebase Directory Tree](#8-codebase-directory-tree)
  - [9. Complete REST API Reference](#9-complete-rest-api-reference)
  - [10. Data Models & Schemas](#10-data-models--schemas)
- [PART 2: Setup, Seeding & System Walkthrough](#part-2-setup-seeding--system-walkthrough)
  - [11. Prerequisites](#11-prerequisites)
  - [12. Step-by-Step Setup Guide (GitHub to Browser)](#12-step-by-step-setup-guide-github-to-browser)
  - [13. Database Seeding & Mock Scenarios](#13-database-seeding--mock-scenarios)
  - [14. Demo Accounts & Credentials](#14-demo-accounts--credentials)
  - [15. End-to-End System Walkthrough & User Stories](#15-end-to-end-system-walkthrough--user-stories)
  - [16. Troubleshooting & FAQs](#16-troubleshooting--faqs)
  - [17. National Health Standards Alignment](#17-national-health-standards-alignment)

---

# PART 1: System Definition, Architecture & Specifications

## 1. Problem Statement

Rural maternal healthcare delivery across remote Primary Health Centres (PHCs) and Sub-Centres in India faces severe operational bottlenecks that directly threaten maternal and neonatal survival:

1. **Fragmented Paper Registries**: Auxiliary Nurse Midwives (ANMs) and Accredited Social Health Activists (ASHAs) maintain multiple bulky, handwritten registers (Mamta cards, RCH registers, village survey books). Data is frequently siloed, duplicate, or lost during inter-village transfers.
2. **Delayed High-Risk Pregnancy (HRP) Detection**: Critical conditions such as severe antenatal anemia ($Hb < 7.0\text{ g/dL}$), gestational hypertension/pre-eclampsia ($BP \ge 140/90\text{ mmHg}$), and gestational diabetes ($Sugar \ge 140\text{ mg/dL}$) are often flagged too late due to a lack of immediate clinical decision support at mobile outreach camps.
3. **Maternal Kit & Supplement Stockouts**: Crucial antenatal supplements—Iron and Folic Acid (IFA) tablets, Calcium, Poshan nutritional rations, and point-of-care Hb rapid test strips—suffer unaccounted stock losses, supply pipeline breaks, and misreported camp dispatches.
4. **Disconnected Emergency Transit**: When a mother experiences an acute obstetric complication in a remote village, coordinating Mobile Medical Units (MMUs) or 108 Emergency Ambulances is chaotic. Critical clinical indicators and transit logs are rarely transferred smoothly to tertiary referral hospitals (Civil/District hospitals).
5. **Cumbersome Monthly Block Reporting**: Generating mandatory monthly Health Management Information System (HMIS) returns requires several days of manual tallying by PHC Medical Officers, pulling healthcare staff away from primary clinical duties.

---

## 2. The MatruKavach Solution

**MatruKavach** (*Mother's Shield*) is a mission-critical, full-stack MERN enterprise health platform designed for harsh, low-bandwidth, rural environments:

- **Ultra-Lean, High-Contrast UI**: Built with a high-density, industrial layout engineered for field laptops, rugged tablets, and low-cost desktop computers used at PHCs.
- **Embedded Clinical Risk Engine (CDSS)**: Instantly stratifies screening vitals into `Normal`, `Moderate`, or `Critical High-Risk` tiers, dynamically scheduling follow-up intervals ($7$, $15$, or $30$ days).
- **Physical Kit Stock Double-Entry Accounting**: Treats maternal medical kits like a financial ledger. Tracks opening balance, multi-vendor lot/batch inflows, camp dispatches, damaged items, and auto-calculates closing stock for next-day carry-forward.
- **Bilingual WhatsApp Digital Health Card**: Generates instant, zero-cost Gujarati and English health cards formatted directly for WhatsApp, allowing field staff to send diagnostic summaries, risk status, and next camp dates to families with one click.
- **Emergency Ambulance & MMU Flight Recorder**: Logs vehicle routes, odometer kilometers, fuel consumption, automated mileage ($\text{km/L}$), patient linkage, and clinical handover outcomes.
- **Instant 31-Day HMIS Block Consolidation**: Automatically aggregates all daily screenings, emergency transfers, and physical inventory tallies into an official review matrix ready for block health meetings.
- **Tamper-Evident Governance**: Implements Medical Officer (MO) day-end cryptographic-style locking to freeze camp reconciliation sheets, with administrative override (unlock) reserved strictly for Block Administrators.

---

## 3. User Roles & Personas

MatruKavach provides strict role-based separation of concerns across four healthcare delivery tiers:

```
┌────────────────────────────────────────────────────────┐
│               BLOCK HEALTH ADMINISTRATOR               │
│ (System & block-wide governance, user admin, unlocks)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  PHC MEDICAL OFFICER                   │
│   (Clinical lead, high-risk review, sheet sign-off)    │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
┌──────────────▼───────────┐   ┌──────────▼──────────────┐
│        ANM NURSE         │   │       ASHA WORKER       │
│ (Field camps, screening, │   │ (Grassroots mobilizer,  │
│  kit stock, 108 booking) │   │  village-scoped radar)  │
└──────────────────────────┘   └─────────────────────────┘
```

### 1. Block Health Administrator (`BLOCK_ADMIN`)
- **Persona**: Block Health Officer (BHO) / District Health Executive.
- **Scope**: Comprehensive visibility across all PHCs, sub-centres, and revenue villages in the administrative block.
- **Key Responsibilities**:
  - Staff user lifecycle management (provisioning, role assignment, facility binding).
  - High-level governance, cross-PHC resource redistribution, and compliance audit trail review.
  - Exclusive administrative authority to **unlock** frozen camp sheets previously locked by Medical Officers.

### 2. PHC Medical Officer (`MEDICAL_OFFICER`)
- **Persona**: MBBS Medical Officer in charge of a Primary Health Centre.
- **Scope**: Entire PHC facility catchment area and affiliated sub-centres.
- **Key Responsibilities**:
  - High-Risk Pregnancy (HRP) triage oversight and secondary diagnostic confirmation.
  - Authorizing critical tertiary referrals (District Hospital / Medical College).
  - **Reviewing and locking (`Lock Sheet`)** daily camp inventory sheets to prevent post-camp data manipulation.
  - Viewing staff rosters and overseeing ANM/ASHA performance.

### 3. ANM Nurse (`ANM`)
- **Persona**: Auxiliary Nurse Midwife conducting village outreach camps and Sub-Centre clinics.
- **Scope**: Assigned village cluster (e.g., Rampur, Kheda).
- **Key Responsibilities**:
  - Point-of-care diagnostic data entry (Hb, Blood Pressure, Blood Sugar, Weight, Gestational Week).
  - Material inventory logging (recording new batch arrivals from district stores, logging damages).
  - Direct dispensing of IFA tablets, Calcium, Poshan packets, and rapid test strips.
  - Registering new antenatal mothers and updating RCH / ABHA records.
  - Initiating emergency 108 ambulance referrals and dispatching WhatsApp digital health cards.

### 4. ASHA Worker (`ASHA`)
- **Persona**: Accredited Social Health Activist working directly in village hamlets.
- **Scope**: **Strictly village-scoped.** An ASHA only accesses antenatal mothers mapped to her assigned village.
- **Key Responsibilities**:
  - Tracking expected dates of delivery (EDD radar) for home visits.
  - Ensuring mothers with missed visits or overdue deliveries report to the PHC.
  - Tracking supplement adherence (iron, calcium) and monitoring high-risk mothers in her jurisdiction.
  - Reviewing MMU transit status and delivery outcomes for her community.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Operational Capability | Route / Action | Block Admin (`BLOCK_ADMIN`) | Medical Officer (`MEDICAL_OFFICER`) | ANM Nurse (`ANM`) | ASHA Worker (`ASHA`) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Daily Camp Workspace** | `GET /api/camps` | Full View | Full View | Full Access | No Access |
| **Carry Forward Stock** | `POST /api/camps/carry-forward` | Read-only | Read-only | Allowed | Denied |
| **Record Screenings** | `POST /api/camps/screenings` | Read-only | Allowed | Allowed | Denied |
| **Update / Delete Screening** | `PUT, DELETE /camps/screenings/:id` | Read-only | Allowed | Allowed (if unlocked) | Denied |
| **Send WhatsApp Health Card**| `POST /camps/screenings/:id/send-card` | Allowed | Allowed | Allowed | Denied |
| **Lock Daily Camp Sheet** | `POST /api/camps/:id/lock` | Denied | **Authorized** | Denied | Denied |
| **Unlock Camp Sheet** | `POST /api/camps/:id/unlock` | **Authorized** | Denied | Denied | Denied |
| **Mother Directory** | `GET /api/beneficiaries` | All Villages | All Villages | All Villages | **Own Village Only** |
| **Register New Mother** | `POST /api/beneficiaries` | Denied | Allowed | Allowed | Denied |
| **Edit Mother Record** | `PUT /api/beneficiaries/:id` | Denied | Allowed | Allowed | Denied |
| **High-Risk Watchlist & EDD** | `GET /beneficiaries/watchlist, edd` | All Villages | All Villages | All Villages | **Own Village Only** |
| **Export Passbook CSV** | Client Download | Allowed | Allowed | Allowed | Allowed (Village) |
| **MMU / 108 Trip Registry** | `GET /api/ambulance` | All Logs | All Logs | All Logs | **Own Village Only** |
| **Log MMU / 108 Referral** | `POST /api/ambulance` | Denied | Allowed | Allowed | Denied |
| **Delete Transit Log** | `DELETE /api/ambulance/:id` | Denied | **Authorized** | Denied | Denied |
| **Monthly HMIS Consolidation**| `GET /api/reports/monthly` | Full Block | Full PHC | Assigned Village | Denied |
| **User Directory** | `GET /api/users` | Full Block | PHC Staff (ANM/ASHA) | Denied | Denied |
| **Create & Update Users** | `POST, PUT /api/users` | **Authorized** | Denied | Denied | Denied |

---

## 5. Core Modules Overview

### Module 1: Daily Camp Workspace (`/`)
- **Daily Camp Sheet Initializer**: Automatically binds to a specific date and village (defaults to current date and base village). Auto-initializes an empty sheet or loads yesterday's closing stock if available.
- **Physical Stock Ledger**:
  - 4 Tracked Antenatal Supplies:
    1. `IFA Tablets`: Iron & Folic Acid blister strips.
    2. `Calcium Packets`: 500mg elemental calcium supplements.
    3. `Poshan Kits`: Supplementary nutrition packets (ICDS).
    4. `Hb Strips`: Point-of-care digital hemoglobin test strips.
  - Multi-inflow support: Record up to 3 separate incoming shipments per day with Batch Numbers, Supplier Names (e.g., District Medical Store, ICDS Block Depot), and received quantities.
  - Automatic balance formula:
    $$\text{Gross Stock} = \text{Old Stock} + \sum \text{Inflows}$$
    $$\text{Closing Stock} = \text{Gross Stock} - \text{Dispatched} - \text{Damaged}$$
- **Real-Time Screening Grid**:
  - Live token sequence numbering ($1, 2, 3\dots$).
  - Beneficiary lookup with auto-fill for gestational age and assigned ASHA.
  - Real-time vitals entry: Hemoglobin ($g/dL$), Blood Pressure (Systolic & Diastolic $mmHg$), Random Blood Sugar ($mg/dL$), Body Weight ($kg$).
  - One-click kit allocation per mother (increments dispatched count in the stock ledger simultaneously).
- **One-Click WhatsApp Health Card**:
  - Generates a URL encoded for `https://wa.me/91<phone>` with a clean, bilingual Gujarati-English diagnostic receipt.
  - Automatically flags whether the digital card was transmitted (`Card Sent` badge) with timestamp recording.
- **Medical Officer Lock Protection**:
  - Once the camp concludes, the Medical Officer reviews the figures and clicks **Lock Sheet**.
  - All inventory rows, vitals inputs, kit allocations, and delete buttons are immediately disabled across all clients. Any update attempts return HTTP 423 (Locked).
  - Only the Block Administrator can perform an **Unlock Sheet** if legitimate post-camp corrections are required.

### Module 2: Mother Directory & High-Risk Ledger (`/beneficiaries`)
- **National Registry Compliance**: Tracks Reproductive & Child Health (RCH) IDs and Ayushman Bharat Health Account (ABHA) IDs.
- **Automated Naegele's Rule Calculation**:
  - Input: Last Menstrual Period (LMP) date.
  - Output: Estimated Date of Delivery ($EDD = \text{LMP} + 280\text{ days}$).
  - Virtual Trimester progression: Automatically evaluates if the mother is in the $1\text{st}$ ($<14$ weeks), $2\text{nd}$ ($14–27$ weeks), or $3\text{rd}$ Trimester ($\ge 28$ weeks).
- **High-Risk Delivery Radar**:
  - Due within 7 Days: Critical delivery alert.
  - Due within 14 Days: Pre-labor logistics alert.
  - Overdue Delivery: Alerts field workers to immediate post-term risks ($>40$ weeks).
  - Overdue Routine Visit: Flags mothers who have missed their scheduled follow-up by $>2$ days.
- **Clinical Timeline Drawer**: Complete historical antenatal log showing past camp dates, gestational progression, Hb trends, and prescribed supplements over time.
- **Passbook CSV Export**: One-click standard CSV generation containing all demographics, clinical indicators, and risk categories for block meetings.

### Module 3: MMU & 108 Emergency Referrals (`/ambulance`)
- **Vehicle Type Segmentation**: Distinct classification between Mobile Medical Unit (`MMU Camp`) outreach transit and emergency obstetric transit (`108 Referral`).
- **Vehicle & Driver Records**: Captures vehicle registration numbers (e.g., `GJ-06-G-1081`), driver names, transit routes, and start/destination villages.
- **Patient Linking**: Directly associates transit runs with registered high-risk mothers and logs emergency referral indications (e.g., *Severe Anemia Hb 5.9 g/dL with impending heart failure*, *Eclampsia BP 160/110 mmHg*).
- **Fuel & Fleet Analytics**:
  - Captures Odometer Distance ($\text{km}$) and Fuel Consumed ($\text{Liters}$).
  - Automatically computes fuel efficiency:
    $$\text{Mileage} = \frac{\text{Distance (km)}}{\text{Fuel (Liters)}}$$
- **Clinical Outcome Tracking**: Tracks admission status (`Admitted`, `Stabilized at PHC`, `Referred Higher`, `Camp Completed`).

### Module 4: Monthly Consolidation & HMIS Reports (`/reports`)
- **HMIS-Aligned Calendar View**: Aggregates data for all 28–31 days of any selected month and year for a chosen village or entire PHC.
- **Consolidated Health Metrics**:
  - Daily & monthly total mothers screened.
  - Anemia breakdown: Severe anemia ($Hb < 7.0$), Moderate anemia ($Hb\ 7.0–9.9$), Mild/Normal.
  - Pre-eclampsia / Gestational Hypertension prevalence ($BP \ge 140/90$).
  - Emergency 108 referrals initiated.
- **Consolidated Physical Stock Balances**:
  - Total kits & test strips received during the month.
  - Total kits distributed during village camps.
  - Closing physical stock reconciliation.
- **Print & PDF Optimized**: Fully styled with CSS print media queries for one-click clean physical printing on A4 landscape paper for government health review sessions.

### Module 5: User & Access Management (`/users`)
- **Staff Lifecycle Directory**: Searchable list of all field and administrative healthcare workers.
- **Profile Parameters**: Name, official email, contact phone number, assigned role, designated village, and base PHC.
- **Account Controls**: Toggle active/inactive account status instantly without database deletion, preserving all historical screening audits.

---

## 6. Clinical Decision Support System (CDSS)

MatruKavach embeds rule-based clinical triage codified in `backend/utils/clinicalRiskEngine.js`. Whenever an ANM enters vitals, the risk engine executes immediately:

```
                      [ Diagnostic Vitals Input ]
                (Hb, Systolic/Diastolic BP, Blood Sugar)
                                  │
          ┌───────────────────────┴───────────────────────┐
          │                                               │
   [ Any Critical Criteria Met? ]                         │
   - Hb < 7.0 g/dL (Severe Anemia)                        │
   - Systolic >= 140 OR Diastolic >= 90 mmHg              │
   - Random Blood Sugar >= 140 mg/dL                      │
          │                                               │
         YES                                              NO
          │                                               │
  ┌───────▼─────────────────┐                 [ Any Moderate Criteria Met? ]
  │  CRITICAL HIGH-RISK     │                 - Hb between 7.0 and 9.9 g/dL
  │  - Red Badge Alert      │                 - Systolic 130-139 OR Diastolic 85-89
  │  - 7-Day Recall Window  │                             │
  │  - 108 Referral Standby │                     ┌───────┴───────┐
  └─────────────────────────┘                    YES              NO
                                                  │               │
                                  ┌───────────────▼─────┐   ┌─────▼───────────────┐
                                  │   MODERATE RISK     │   │     NORMAL RISK     │
                                  │ - Amber Badge Alert │   │ - Green Badge       │
                                  │ - 15-Day Recall     │   │ - 30-Day Routine    │
                                  │ - Supplement Review │   │   Antenatal Checkup │
                                  └─────────────────────┘   └─────────────────────┘
```

### Mathematical Decision Parameters

| Clinical Parameter | Normal Status | Moderate Risk | Critical High-Risk | Clinical Indication / Action |
| :--- | :---: | :---: | :---: | :--- |
| **Hemoglobin (Hb)** | $\ge 11.0\text{ g/dL}$ | $7.0 - 9.9\text{ g/dL}$ | $< 7.0\text{ g/dL}$ | **Severe Anemia**: Urgent IV Iron Sucrose or blood transfusion referral. |
| **Blood Pressure (BP)** | $< 130/85\text{ mmHg}$ | $130-139 / 85-89\text{ mmHg}$ | $\ge 140/90\text{ mmHg}$ | **Pre-eclampsia**: Magnesium sulfate standby, urgent MO assessment. |
| **Random Blood Sugar** | $< 140\text{ mg/dL}$ | — | $\ge 140\text{ mg/dL}$ | **Gestational Diabetes (GDM)**: Glucose tolerance testing referral. |
| **Next Visit Recall** | **30 Days** | **15 Days** | **7 Days** | Automated next appointment date computed on record save. |

---

## 7. Tech Stack & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER (BROWSER)                         │
│  React 18.3  •  Vite 5.4  •  Tailwind CSS 3.4  •  React Router 6.27   │
│  Lucide React Icons  •  Axios HTTP Interceptor  •  Local Auth Token    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON)
                                    │ Bearer JWT Authentication
┌───────────────────────────────────▼────────────────────────────────────┐
│                         APPLICATION TIER (API)                         │
│  Node.js 18+  •  Express 4.21  •  Express Async Handler                │
│  JWT Authentication  •  Bcrypt Password Hashing  •  CORS Engine       │
│  Clinical Risk Engine  •  Stock Double-Entry Reconciliation Middleware  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose 8.8 ODM
                                    │ Connection Pooling & Indices
┌───────────────────────────────────▼────────────────────────────────────┐
│                          DATABASE TIER (DATA)                          │
│  MongoDB Community Server / MongoDB Atlas                              │
│  Indexed Collections: Users, Beneficiaries, CampSheets,                │
│                       ScreeningRecords, AmbulanceLogs                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Technologies Used

- **Frontend**:
  - **React 18.3**: Declarative component-based UI.
  - **Vite 5.4**: Lightning-fast Hot Module Replacement (HMR) and optimized ES builds.
  - **Tailwind CSS 3.4**: Utility-first CSS configured with custom high-contrast palettes, brutalist borders, and print styling.
  - **React Router DOM 6.27**: Declarative client-side routing with role-guarded route trees.
  - **Axios 1.7**: Centralized HTTP client configured with request/response interceptors for automatic JWT attachment and global loading indicators.
  - **Lucide React 0.454**: Accessible, ultra-lightweight medical and system iconography.

- **Backend**:
  - **Node.js 18+**: Asynchronous event-driven JavaScript runtime.
  - **Express 4.21**: Fast, minimalist web framework for RESTful APIs.
  - **Mongoose 8.8**: Schema-based Object Data Modeling (ODM) with pre-validation hooks and virtual properties.
  - **JSON Web Tokens (jsonwebtoken 9.0)**: Stateless authentication via signed tokens.
  - **Bcrypt 5.1**: Adaptive cryptographic hashing for credential security.
  - **CORS 2.8**: Cross-Origin Resource Sharing control with configurable origins.
  - **Concurrently 9.0**: Root script engine to run API and client dev servers simultaneously.

---

## 8. Codebase Directory Tree

```
matrukavach-health-erp/
├── package.json                 # Monorepo coordinator scripts (concurrent dev, seed, install:all)
├── package-lock.json
├── README.md                    # System documentation and operational manual
│
├── backend/                     # Express REST API Server
│   ├── .env                     # Backend runtime secrets (PORT, MONGODB_URI, JWT_SECRET)
│   ├── .env.example             # Template for backend environment variables
│   ├── package.json             # Backend dependencies and startup scripts
│   ├── server.js                # Server entry point, database connection, route mounting
│   ├── seed.js                  # Database seeder with realistic rural maternal scenarios
│   │
│   ├── config/
│   │   └── db.js                # Mongoose connection manager with error handling
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification (`protect`) and role-based guard (`authorize`)
│   │   └── errorMiddleware.js   # Centralized 404 handler and JSON exception formatter
│   │
│   ├── models/                  # Mongoose Schemas and Models
│   │   ├── User.js              # User model with bcrypt pre-save hashing & JWT token signer
│   │   ├── Beneficiary.js       # Mother model with Naegele's rule EDD and trimester virtuals
│   │   ├── DailyCampSheet.js    # Camp sheet model with inventory formulas & pre-save recalculation
│   │   ├── ScreeningRecord.js   # Diagnostic screening model with pre-validate CDSS risk logic
│   │   └── AmbulanceLog.js      # Transit model with automated km/L mileage computation
│   │
│   ├── routes/                  # Express Router Modules
│   │   ├── authRoutes.js        # POST /login, GET /me
│   │   ├── userRoutes.js        # GET /, POST /, PUT /:id (Block Admin & MO)
│   │   ├── dailyCampRoutes.js   # Camp sheets, stock carry-forward, screening CRUD, lock/unlock
│   │   ├── beneficiaryRoutes.js # Mothers directory, watchlist, EDD radar, clinical timeline
│   │   ├── ambulanceRoutes.js   # MMU and 108 emergency transit logs
│   │   └── reportRoutes.js      # Monthly HMIS 31-day report and village list
│   │
│   ├── controllers/             # Business Logic & Database Operations
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── dailyCampController.js
│   │   ├── beneficiaryController.js
│   │   ├── ambulanceController.js
│   │   └── reportController.js
│   │
│   └── utils/
│       ├── clinicalRiskEngine.js # Algorithmic clinical risk scoring, anemia triage & recall rules
│       └── dateHelpers.js       # Date boundary normalizers, calendar day iterators, regex escape
│
└── frontend/                    # Vite + React Single-Page Application
    ├── .env                     # Client runtime configuration (VITE_API_BASE_URL)
    ├── .env.example             # Template for frontend environment variables
    ├── index.html               # Main HTML entry point
    ├── package.json             # Frontend dependencies and Vite build scripts
    ├── vite.config.js           # Vite build pipeline and React plugin setup
    ├── tailwind.config.js       # Tailwind CSS theme customization and brutalist styling tokens
    ├── postcss.config.js
    │
    └── src/
        ├── App.jsx              # Root router, ErrorBoundary, Protected route wrappers
        ├── main.jsx             # React DOM root hydration
        ├── index.css            # Global CSS, Tailwind directives, badges, print stylesheet
        │
        ├── api/
        │   ├── axiosInstance.js # Axios instance with JWT interceptor & global spinner hooks
        │   └── services.js      # Typed API endpoint methods mapped to backend routes
        │
        ├── context/
        │   └── AuthContext.jsx  # React Context holding current session user, login, and logout
        │
        ├── components/
        │   └── common/
        │       ├── Navbar.jsx   # Top application header with active role badge and logout
        │       ├── Sidebar.jsx  # Icon-based navigation bar with role-scoped links & tooltips
        │       └── LoadingSpinner.jsx # Global full-screen blocking loading overlay
        │
        ├── pages/               # Functional Application Views
        │   ├── Login.jsx        # Credentials login screen with demo-account quick fill buttons
        │   ├── DailyCampWorkspace.jsx     # Module 1: Stock ledger, screening grid, lock/unlock
        │   ├── BeneficiaryAndRiskLedger.jsx # Module 2: Mother directory, EDD radar, CSV export
        │   ├── AmbulanceAndReferrals.jsx    # Module 3: MMU & 108 fleet logs, mileage analytics
        │   ├── MonthlyHealthReport.jsx    # Module 4: 31-day HMIS consolidation & print layout
        │   └── UserManagement.jsx         # Module 5: Administrative staff management
        │
        └── utils/
            └── format.js        # Date formatters (DMY/YMD), CSV builder, WhatsApp link encoder
```

---

## 9. Complete REST API Reference

All protected endpoints require the HTTP Authorization header:  
`Authorization: Bearer <jwt_token>`

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Authorization | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns user payload + JWT | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/me` | Protected | Returns safe user session profile for current token | *None* |

### 2. Daily Camps & Screenings (`/api/camps`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/camps` | ANM, MO, Admin | Fetches or creates daily camp sheet for query `?date=YYYY-MM-DD&village=Name` |
| `POST`| `/api/camps/carry-forward` | ANM, MO | Copies closing stock from previous recorded camp day into current sheet |
| `PUT` | `/api/camps/:id` | ANM, MO | Updates stock inflows, damaged quantities, and recalculates sheet balances |
| `POST`| `/api/camps/:id/lock` | **Medical Officer** | Locks camp sheet, freezing all screening edits and stock modifications |
| `POST`| `/api/camps/:id/unlock` | **Block Admin** | Unlocks a frozen camp sheet for administrative corrections |
| `GET` | `/api/camps/screenings` | ANM, MO, Admin | Lists all screening records for a specific camp sheet |
| `POST`| `/api/camps/screenings` | ANM, MO | Records vitals, executes CDSS risk evaluation, dispenses kits, saves token |
| `PUT` | `/api/camps/screenings/:id` | ANM, MO | Updates screening row vitals and recalculates clinical risk (if unlocked) |
| `DELETE`| `/api/camps/screenings/:id` | ANM, MO | Deletes a screening record and automatically reverses dispatched kit stock |
| `POST`| `/api/camps/screenings/:id/send-card` | ANM, MO | Marks WhatsApp digital health card as transmitted (`healthCardSent: true`) |

### 3. Beneficiaries & Risk Ledger (`/api/beneficiaries`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/beneficiaries` | All Roles | Lists registered mothers. Filterable by `q`, `village`, `riskLevel`, `anemiaStatus`, `trimester`. *(Restricted to own village for ASHA)* |
| `GET` | `/api/beneficiaries/watchlist` | All Roles | Returns critical high-risk mothers, pending delivery deliveries, and overdue visits |
| `GET` | `/api/beneficiaries/edd-alerts` | All Roles | Returns lists of deliveries due in 7 days, 14 days, and overdue deliveries |
| `POST`| `/api/beneficiaries` | ANM, MO | Registers a new antenatal mother, calculates EDD via Naegele's rule |
| `GET` | `/api/beneficiaries/:id` | All Roles | Returns full profile of a single beneficiary |
| `GET` | `/api/beneficiaries/:id/timeline` | All Roles | Returns chronological screening history for maternal passbook review |
| `PUT` | `/api/beneficiaries/:id` | ANM, MO | Updates mother details, baseline Hb, blood group, phone, or assigned ASHA |

### 4. MMU & 108 Emergency Ambulance (`/api/ambulance`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ambulance` | All Roles | Returns vehicle trip logs, odometer distances, and total emergency referrals |
| `POST`| `/api/ambulance` | ANM, MO | Creates a new transit log, computes fuel mileage, links referred mother |
| `PUT` | `/api/ambulance/:id` | ANM, MO | Updates route, kilometers, fuel consumption, or handover outcome |
| `DELETE`| `/api/ambulance/:id` | **Medical Officer** | Deletes transit record from registry |

### 5. Consolidated Reports (`/api/reports`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/monthly` | ANM, MO, Admin | Returns 31-day aggregated matrix for query `?year=2026&month=10&village=Rampur` |
| `GET` | `/api/reports/villages` | ANM, MO, Admin | Returns distinct active villages for filter dropdowns |

### 6. User Management (`/api/users`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | MO, Admin | Lists health personnel. MO is scoped to own PHC (ANM/ASHA staff only) |
| `POST`| `/api/users` | **Block Admin** | Provisions a new user account with hashed password and role |
| `PUT` | `/api/users/:id` | **Block Admin** | Updates user details, assigned village/PHC, or toggles active status |

---

## 10. Data Models & Schemas

### 1. `DailyCampSheet`
- `date` *(Date, indexed)*: Calendar date of the village camp.
- `village` *(String, indexed)*: Revenue village where the outreach camp is hosted.
- `stock` *(Object)*: Contains 4 sub-documents (`ifa`, `calcium`, `poshan`, `hbStrips`), each holding:
  - `oldStock` *(Number)*: Opening balance from previous camp.
  - `inflows` *(Array of `{ batchNo, supplier, quantity }`)*: Incoming store shipments.
  - `dispatched` *(Number)*: Dispatched during screenings.
  - `damaged` *(Number)*: Broken, expired, or defective units.
  - `closing` *(Number)*: Derived closing stock.
- `locked` *(Boolean, default false)*: Locking status flag.
- `lockedBy` *(ObjectId ref `User`)*: Medical officer who verified and locked the sheet.
- `lockedAt` *(Date)*: Timestamp of lock event.

### 2. `ScreeningRecord`
- `campSheet` *(ObjectId ref `DailyCampSheet`)*: Parent camp session.
- `campDate` *(Date)*: Camp date.
- `village` *(String)*: Camp village.
- `tokenNo` *(Number)*: Daily sequential queue number.
- `beneficiary` *(ObjectId ref `Beneficiary`)*: Screened antenatal mother.
- `gestWeek` *(Number, 1–42)*: Current gestational age in weeks.
- `hb` *(Number)*: Hemoglobin reading ($g/dL$).
- `bpSystolic` & `bpDiastolic` *(Numbers)*: Blood pressure measurements ($mmHg$).
- `bloodSugar` *(Number)*: Random blood sugar ($mg/dL$).
- `weightKg` *(Number)*: Maternal weight in kilograms.
- `riskStatus` *(String: `Normal`, `Moderate`, `Critical High-Risk`)*: Auto-assigned by CDSS.
- `anemiaStatus` *(String: `None`, `Mild`, `Moderate`, `Severe`)*: Auto-classified by Hb.
- `kitsGiven` *(Object: `{ ifa, calcium, poshan, hbStrips }`)*: Supplements dispensed.
- `nextVisitDate` *(Date)*: Auto-computed appointment date based on risk level.
- `healthCardSent` *(Boolean)*: WhatsApp delivery confirmation flag.

### 3. `Beneficiary`
- `name` *(String)*: Full name of the antenatal mother.
- `rchId` *(String, unique)*: Official National Reproductive and Child Health identification.
- `abhaId` *(String)*: Ayushman Bharat Health Account ID.
- `phone` *(String)*: Contact mobile number.
- `village` *(String)*: Residential village.
- `assignedAsha` *(ObjectId ref `User`)*: Community ASHA worker assigned to the mother.
- `lmpDate` *(Date)*: Last Menstrual Period date.
- `edd` *(Date)*: Estimated Date of Delivery ($LMP + 280\text{ days}$).
- `baselineHb` *(Number)*: First trimester baseline hemoglobin.
- `bloodGroup` *(Enum: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, `Unknown`)*.
- `currentRiskLevel` *(Enum: `Normal`, `Moderate`, `Critical High-Risk`)*.
- `anemiaStatus` *(String)*: Current anemia category.

### 4. `AmbulanceLog`
- `date` *(Date)*: Date of transport run.
- `vehicleNo` *(String)*: Registration plate number.
- `driverName` *(String)*: Driver on duty.
- `route` *(String)*: Route taken (e.g., *Rampur PHC → District Civil Hospital*).
- `referredMother` *(ObjectId ref `Beneficiary`)*: Associated patient.
- `referralReason` *(String)*: Medical justification for urgent transfer.
- `km` *(Number)*: Total odometer distance traveled.
- `fuelLiters` *(Number)*: Fuel consumed.
- `mileage` *(Number)*: Auto-calculated efficiency ($\text{km/L}$).
- `tripType` *(Enum: `MMU Camp`, `108 Referral`, `Other`)*.
- `outcome` *(String)*: Handover outcome (`Admitted`, `Stabilized at PHC`, `Completed`).

---

# PART 2: Setup, Seeding & System Walkthrough

## 11. Prerequisites

Before installing MatruKavach, ensure the following runtime dependencies are installed on your machine:

1. **Node.js**: Version `18.0.0` or higher (tested on Node v18, v20, and v22).
   - Check version: `node -v`
2. **npm**: Version `9.0.0` or higher (comes bundled with Node.js).
   - Check version: `npm -v`
3. **MongoDB**:
   - **Option A (Local)**: MongoDB Community Server (v6.0+) running locally on `mongodb://127.0.0.1:27017`.
   - **Option B (Cloud)**: A free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) with a standard connection string (`mongodb+srv://...`).
4. **Git**: Distributed version control system.
   - Check version: `git --version`
5. **Modern Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari with JavaScript enabled.

---

## 12. Step-by-Step Setup Guide (GitHub to Browser)

Follow this complete step-by-step procedure to get MatruKavach cloned, configured, seeded, and running in your browser:

### Step 1: Clone the Repository
Open your terminal (PowerShell, Command Prompt, or Bash) and clone the project:

```bash
git clone https://github.com/your-org/matrukavach-health-erp.git
cd matrukavach-health-erp
```

---

### Step 2: Install All Dependencies
The repository contains a monorepo structure with dependencies at the root, in `/backend`, and in `/frontend`. Run the top-level orchestrator script:

```bash
# Installs root dev-dependencies (concurrently)
npm install

# Installs backend and frontend dependencies in one command
npm run install:all
```

*Alternatively, install them manually:*
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

---

### Step 3: Configure Environment Variables

#### 1. Backend Environment Setup (`backend/.env`)
Create a file named `.env` inside the `backend/` directory by copying `backend/.env.example`:

**On Windows (PowerShell):**
```powershell
Copy-Item backend/.env.example backend/.env
```

**On Linux / macOS:**
```bash
cp backend/.env.example backend/.env
```

Verify or update the parameters inside `backend/.env`:

```env
# -------------------------------------------------------------
# MatruKavach Backend Environment Variables
# -------------------------------------------------------------

# For Local MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/matrukavach_db

# For MongoDB Atlas (Live Cloud Database):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/matrukavach_db?retryWrites=true&w=majority

PORT=5000
JWT_SECRET=super_secret_matrukavach_production_key_2026
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
```

#### 2. Frontend Environment Setup (`frontend/.env`)
Create a file named `.env` inside the `frontend/` directory by copying `frontend/.env.example`:

**On Windows (PowerShell):**
```powershell
Copy-Item frontend/.env.example frontend/.env
```

**On Linux / macOS:**
```bash
cp frontend/.env.example frontend/.env
```

Ensure the API base URL points to your running backend:

```env
# -------------------------------------------------------------
# MatruKavach Frontend Environment Variables
# -------------------------------------------------------------
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Step 4: Populate the Database with Seed Data
Before starting the servers, initialize your MongoDB database with realistic rural health data:

```bash
npm run seed
```

This single command executes `backend/seed.js`. You will see output confirming the insertion of:
- **6 User Accounts** across 4 healthcare roles (`BLOCK_ADMIN`, `MEDICAL_OFFICER`, `ANM`, `ASHA`).
- **15 Antenatal Beneficiaries** distributed across 4 villages with realistic clinical conditions (Severe Anemia, Gestational Diabetes, Pre-eclampsia, and Normal pregnancies).
- **Consecutive Daily Camp Sheets** (Yesterday and Today) with supplier stock inflows, dispatches, and damaged items.
- **Diagnostic Screenings** with computed CDSS risk statuses and kit distributions.
- **MMU & 108 Emergency Transit Records** with odometer kilometers and mileage calculations.

---

### Step 5: Launch the Application
Start both the Node.js API backend and the Vite frontend simultaneously with a single command:

```bash
npm run dev
```

*What happens behind the scenes:*
- `concurrently` starts the backend on port `5000` (`http://localhost:5000`)
- `concurrently` starts Vite on port `5173` (`http://localhost:5173`)

*Prefer separate terminals?*
- Terminal 1 (Backend): `npm run dev:backend`
- Terminal 2 (Frontend): `npm run dev:frontend`

---

### Step 6: Verify and Access the Application

1. **Verify Backend Health**:
   Open your browser or run `curl`:
   ```
   http://localhost:5000/api/health
   ```
   Expected JSON response:
   ```json
   { "ok": true, "service": "MatruKavach API" }
   ```

2. **Open the MatruKavach Web Application**:
   Navigate to:
   ```
   http://localhost:5173
   ```
   You will be greeted by the high-contrast MatruKavach Sign In portal.

---

## 13. Database Seeding & Mock Scenarios

The seed script (`backend/seed.js`) provisions a rich clinical landscape designed to test all edge cases immediately:

- **15 Rural Antenatal Beneficiaries**:
  - `Bhavna Vasava` (RCH-GJ-1002, Kheda): Gestational week 39, **Severe Anemia ($Hb\ 6.4\text{ g/dL}$)** and high blood pressure ($148/96\text{ mmHg}$) $\rightarrow$ Classified as `Critical High-Risk`. Linked to emergency 108 referral to District Civil Hospital.
  - `Meenaben Parmar` (RCH-GJ-1010, Kheda): Gestational week 39, **Severe Anemia ($Hb\ 6.2\text{ g/dL}$)** with gestational diabetes indication ($Sugar\ 138\text{ mg/dL}$) $\rightarrow$ Classified as `Critical High-Risk`.
  - `Shakuntala Rathod` (RCH-GJ-1014, Rampur): Gestational week 38, **Severe Anemia ($Hb\ 5.9\text{ g/dL}$)** $\rightarrow$ Admitted and stabilized at PHC.
  - `Narmada Bariya` (RCH-GJ-1003, Moti Vav): Moderate anemia ($Hb\ 8.1\text{ g/dL}$) $\rightarrow$ Classified as `Moderate Risk`, scheduled for 15-day follow-up.
  - `Kalpana Rathod`, `Savita Tadvi`, `Pooja Gohil`: Healthy pregnancies ($Hb \ge 11.0\text{ g/dL}$, normal BP) $\rightarrow$ Classified as `Normal Risk`, scheduled for 30-day checkup.
- **Physical Kit Stock Lots**:
  - Batch `IFA-D26` and `IFA-D27` from *District Store Vadodara*.
  - Batch `CA-D11` and `CA-D12` from *District Store Vadodara*.
  - Batch `POS-09` and `POS-10` from *ICDS Block Store*.
  - Batch `HB-44` and `HB-45` from *NHM Diagnostics*.
- **Transit Logs**:
  - Vehicle `GJ-06-G-1081`: 108 Ambulance referral trip of 42 km on 5.5 liters of fuel ($\text{Mileage } 7.64\text{ km/L}$).
  - Vehicle `GJ-06-MMU-12`: Mobile Medical Unit outreach circuit of 68 km on 8.0 liters of fuel ($\text{Mileage } 8.50\text{ km/L}$).

---

## 14. Demo Accounts & Credentials

> **Master Password for all demo accounts:** `Password@123`

The login screen also provides **Quick Sign In** buttons to populate credentials with a single click.

| Email | Password | Role | Name | Facility & Scope | Recommended Workflow to Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`admin@block.gov.in`** | `Password@123` | **Block Admin** | Ramesh Desai | Block Health Office (All PHCs & Villages) | Staff management, block-wide HMIS audit, **unlocking** camp sheets locked by doctors. |
| **`meena@phc.gov.in`** | `Password@123` | **Medical Officer** | Dr. Meena Patel | PHC Rampur (All villages in catchment) | High-risk triage review, 108 dispatch authorization, **locking** daily camp sheets. |
| **`kavita@phc.gov.in`** | `Password@123` | **ANM Nurse** | Kavita Solanki | Village Camps (Rampur & Kheda) | Point-of-care screenings, physical kit ledger stock entry, WhatsApp health card generation. |
| **`rekha@phc.gov.in`** | `Password@123` | **ASHA Worker** | Rekha Rathod | Village Rampur Catchment | Village-scoped EDD radar, home follow-up tracking, maternal passbook monitoring. |
| **`leela@phc.gov.in`** | `Password@123` | **ASHA Worker** | Leela Vasava | Village Kheda Catchment | Village-scoped tracking of severe high-risk mothers in Kheda hamlet. |
| **`sita@phc.gov.in`** | `Password@123` | **ASHA Worker** | Sita Bariya | Village Moti Vav Catchment | Grassroots monitoring for Moti Vav beneficiaries. |

---

## 15. End-to-End System Walkthrough & User Stories

Test the complete system using these realistic field workflows:

### Workflow 1: Conducting an Outreach Camp & Triage (ANM Nurse)
1. Sign in as `kavita@phc.gov.in` (ANM Nurse).
2. The system directs you to **1. Daily Camp Workspace** (`/`).
3. Note the pre-populated **Physical Stock Ledger**:
   - Check the opening stock, existing batches, dispatched amounts, and closing stock.
   - Click **Record Damaged / Expired** to log 2 damaged IFA strips. Watch the closing stock update instantly.
4. Scroll to **Screening & Point-of-Care Diagnostics**:
   - Select an unassigned mother from the dropdown (or click **+ Register New Mother**).
   - Enter vitals: Gestational Week `34`, Hemoglobin `6.7` g/dL, BP `145 / 95` mmHg, Sugar `150` mg/dL, Weight `60` kg.
   - Allocate kits: IFA `2`, Calcium `1`, Poshan `1`, Hb Strips `1`.
   - Click **Save Screening**.
   - Notice that the CDSS immediately assigns a flashing red **`Critical High-Risk`** badge and auto-schedules the next visit for **7 days** later.
5. In the screening table, click **WhatsApp Card**:
   - Inspect the bilingual Gujarati-English preview text with formatted vitals and diet advice.
   - Click **Send via WhatsApp** to launch the prepared WhatsApp Web / Mobile dialogue.
   - Notice the status updates to **`Card Sent`**.

---

### Workflow 2: End-of-Day Sheet Verification & Locking (Medical Officer)
1. Sign in as `meena@phc.gov.in` (Dr. Meena Patel, Medical Officer).
2. Go to **1. Daily Camp Workspace** (`/`).
3. Review the stock reconciliation and screening rows completed by the ANM.
4. Click the prominent **Lock Sheet** button in the header.
5. Confirm the action. The workspace banner turns gold: `Sheet Locked by Medical Officer`.
6. Notice that all editing controls, kit adjustment inputs, and delete buttons are now disabled to preserve data integrity.
7. Switch back to ANM (`kavita@phc.gov.in`) in an incognito window:
   - Notice the ANM sees the locked status and cannot alter any records. Attempting to force an edit results in an HTTP 423 error.

---

### Workflow 3: Administrative Sheet Unlock (Block Admin)
1. If an emergency correction is needed on a locked sheet, sign in as `admin@block.gov.in` (Block Admin Ramesh Desai).
2. Navigate to **1. Daily Camp Workspace** (`/`).
3. Notice that as Block Admin, an exclusive **Unlock Sheet (Admin Override)** button is available.
4. Click **Unlock Sheet**. The lock is lifted, permitting the ANM and Medical Officer to make authorized corrections.

---

### Workflow 4: High-Risk Antenatal Radar & Overdue Follow-up (ASHA Worker)
1. Sign in as `rekha@phc.gov.in` (ASHA Worker Rekha).
2. Notice the navigation sidebar is restricted: Rekha only has access to:
   - **Mother Directory & Risk Ledger**
   - **MMU / 108 Referrals**
   *(Daily Camp Workspace, Monthly Consolidation, and User Management are hidden).*
3. Open **Mother Directory / Risk**:
   - Observe that only mothers belonging to Rekha's assigned village (**Rampur**) are visible. Mothers from Kheda or Moti Vav are filtered out at the API level.
4. View the **EDD Delivery Radar**:
   - Check mothers due within 7 days, 14 days, or overdue for delivery.
5. Open the **Clinical Timeline** for any mother to review her gestational weight gain and hemoglobin curve across past camps.
6. Click **Export Passbook CSV** to download a clean spreadsheet for the village health committee.

---

### Workflow 5: Emergency 108 Dispatch & MMU Transit Logging
1. Sign in as `meena@phc.gov.in` (Medical Officer) or `kavita@phc.gov.in` (ANM).
2. Navigate to **3. MMU / 108 Referrals** (`/ambulance`).
3. Review the summary metrics: Total Kilometers Logged, Total Fuel Consumed, and Emergency 108 Referrals.
4. Click **+ Log Ambulance / MMU Trip**:
   - Select Date: Today.
   - Trip Type: `108 Referral`.
   - Vehicle No: `GJ-06-G-1081`.
   - Driver Name: `Raju Bariya`.
   - Route: `Rampur PHC → District Civil Hospital Vadodara`.
   - Select Referred Mother: `Bhavna Vasava`.
   - Reason: `Severe anemia (Hb 6.4) and Pre-eclampsia (BP 148/96)`.
   - Distance: `44` km, Fuel: `5.5` Liters.
   - Outcome: `Admitted`.
5. Click **Record Trip**.
6. The registry logs the trip and calculates fuel economy: $\frac{44\text{ km}}{5.5\text{ L}} = 8.00\text{ km/L}$.

---

### Workflow 6: HMIS Monthly Consolidation & Block Reporting
1. Sign in as `admin@block.gov.in` or `meena@phc.gov.in`.
2. Navigate to **4. Monthly Consolidation** (`/reports`).
3. Select Month: `October`, Year: `2026`, Village: `All Villages` (or filter by `Rampur`).
4. The system aggregates all 31 days into an HMIS-compliant summary matrix:
   - Daily screening counts
   - Severe Anemia cases ($Hb < 7.0$)
   - Pre-eclampsia cases ($BP \ge 140/90$)
   - Total Kits Received vs Distributed
   - Closing stock balances
5. Click **Print / Export PDF**: The interface switches to an optimized print layout with headers and page breaks for formal block health review meetings.

---

## 16. Troubleshooting & FAQs

### Q1: `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`
- **Cause**: Local MongoDB service is not running on your computer.
- **Fix (Windows)**:
  - Open PowerShell as Administrator and run: `net start MongoDB`
  - Or start it via Windows Services: Search `services.msc` $\rightarrow$ find **MongoDB Server** $\rightarrow$ Click **Start**.
- **Fix (Mac/Linux)**:
  - Run: `brew services start mongodb-community` or `sudo systemctl start mongod`
- **Alternative**: Use a free MongoDB Atlas connection string in `backend/.env`.

---

### Q2: `CORS error` or `Network Error` in browser console
- **Cause**: The frontend is attempting to call an API origin that is not whitelisted or the backend server is not running.
- **Fix**:
  1. Verify the backend is active at `http://localhost:5000/api/health`.
  2. In `backend/.env`, ensure `FRONTEND_ORIGIN=http://localhost:5173`.
  3. In `frontend/.env`, ensure `VITE_API_BASE_URL=http://localhost:5000/api`.

---

### Q3: How do I reset the database to a clean demo state?
- Run:
  ```bash
  npm run seed
  ```
  This drops existing collections and repopulates all demo mothers, stock ledgers, and accounts.

---

### Q4: `Error: Camp sheet is locked by Medical Officer (Status 423)`
- **Cause**: A Medical Officer has finalized and locked the camp session. Edits are prohibited to prevent tampering.
- **Fix**: Log in with the **Block Admin** account (`admin@block.gov.in`) and click **Unlock Sheet (Admin Override)** in the Daily Camp Workspace header.

---

### Q5: How do I build the application for production deployment?
1. Build the React frontend:
   ```bash
   cd frontend
   npm run build
   ```
   This generates an optimized bundle in `frontend/dist/`.
2. Serve the static bundle via Nginx, Apache, or configure `backend/server.js` with `express.static(path.join(__dirname, '../frontend/dist'))`.
3. Set `NODE_ENV=production` and use a strong, cryptographically generated string for `JWT_SECRET` in `backend/.env`.

---

## 17. National Health Standards Alignment

MatruKavach is designed to align with government maternal health directives in India:

- **National Health Mission (NHM)**: Standardizes sub-centre inventory monitoring for IFA, Calcium, and Nutrition packets.
- **Reproductive and Child Health (RCH 2.0)**: Supports mandatory tracking of 12-digit RCH IDs, gestational age tracking, and high-risk referral compliance.
- **Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)**: Aligns with the 9th-of-every-month high-risk pregnancy screening and triage protocols.
- **Ayushman Bharat Digital Mission (ABDM)**: Incorporates 14-digit Ayushman Bharat Health Account (ABHA) IDs for seamless longitudinal record linkage.
- **HMIS Formats**: Outputs monthly block consolidation data matching Form 6 (Sub-Centre / PHC Monthly Report) for maternal health indicators.

---

### Open Source & Community
Built with dedication for frontline healthcare workers across rural Primary Health Centres.  
Contributions, bug reports, and pull requests are welcome.

**MatruKavach Team** — *Protecting Mothers, Empowering Frontline Healthcare.*
