# System Architecture & Specifications

This document outlines the core problem, the MatruKavach solution, tech stack, Role-Based Access Control (RBAC), and the underlying data schemas.

## 1. Problem Statement & Solution

**The Problem:** Rural maternal healthcare relies heavily on fragmented paper registries, leading to delayed High-Risk Pregnancy (HRP) detection, unaccounted stockouts of critical supplements (IFA, Calcium), and disconnected emergency transit for deliveries.

**The Solution:** MatruKavach is a clinical ERP featuring an **Ultra-Lean, High-Contrast UI** for low-spec field computers. It embeds a **Clinical Risk Engine (CDSS)** to instantly flag severe anemia and pre-eclampsia, implements strict **Kit Stock Accounting**, and generates **Bilingual WhatsApp Digital Health Cards** to empower families.

## 2. Tech Stack

- **Frontend**: React 18.3, Vite 5.4, Tailwind CSS 3.4, React Router 6, Axios.
- **Backend**: Node.js 18+, Express 4.21, Mongoose 8.8 (MongoDB), JWT Auth, Bcrypt.

## 3. User Roles & RBAC Matrix

MatruKavach enforces strict segregation of duties:

1. **Block Admin (`BLOCK_ADMIN`)**: Oversees all PHCs, manages users, and has exclusive rights to *Unlock* daily camp sheets.
2. **Medical Officer (`MEDICAL_OFFICER`)**: Clinical lead. Authorizes high-risk treatments and explicitly *Locks* daily sheets at day-end to prevent tampering.
3. **ANM Nurse (`ANM`)**: Main operator. Enters vitals, manages inventory, dispenses kits, and sends WhatsApp cards. Cannot lock/unlock sheets.
4. **ASHA Worker (`ASHA`)**: Grassroots worker. View is strictly limited to mothers from her assigned village.

## 4. Core Modules Overview

- **Module 1: Daily Camp Workspace (`/`)**: Split-screen design. Top handles daily physical stock ledger (IFA, Calcium, Poshan). Bottom handles real-time screening grid with auto-risk calculation.
- **Module 2: Mother Directory (`/beneficiaries`)**: Tracks RCH IDs, calculates EDD via Naegele's rule, and features a "High-Risk Delivery Radar" for impending deliveries.
- **Module 3: MMU & 108 Referrals (`/ambulance`)**: Logs emergency transit, calculates vehicle mileage (km/L), and records clinical handover outcomes.
- **Module 4: Monthly Consolidation (`/reports`)**: Auto-aggregates 31-day data into HMIS-compliant matrices for government review.
- **Module 5: User Management (`/users`)**: Staff lifecycle directory (Admin only).

## 5. Clinical Decision Support System (CDSS)

The embedded engine (`clinicalRiskEngine.js`) automatically stratifies vitals on save:

| Parameter | Normal Status | Moderate Risk | Critical High-Risk (Red Badge) |
| :--- | :--- | :--- | :--- |
| **Hemoglobin (Hb)** | $\ge 11.0\text{ g/dL}$ | $7.0 - 9.9\text{ g/dL}$ | **$< 7.0\text{ g/dL}$** (Severe Anemia) |
| **Blood Pressure** | $< 130/85\text{ mmHg}$ | $130-139 / 85-89\text{ mmHg}$ | **$\ge 140/90\text{ mmHg}$** (Pre-eclampsia) |
| **Blood Sugar** | $< 140\text{ mg/dL}$ | — | **$\ge 140\text{ mg/dL}$** (GDM) |
| **Next Visit Recall** | **30 Days** | **15 Days** | **7 Days** |

## 6. Data Models (Mongoose)

- **DailyCampSheet**: Tracks `date`, `village`, nested `stock` (old, inflows, dispatched, damaged, closing), and `locked` status.
- **ScreeningRecord**: Tracks `hb`, `bp`, `sugar`, auto-calculated `riskStatus`, and `kitsGiven`. Linked to `DailyCampSheet`.
- **Beneficiary**: Tracks demographics, `rchId`, `assignedAsha`, `lmpDate`, auto-calculated `edd`, and virtual trimester.
- **AmbulanceLog**: Tracks `vehicleNo`, `route`, `referredMother`, `km`, `fuelLiters`, and derived `mileage`.