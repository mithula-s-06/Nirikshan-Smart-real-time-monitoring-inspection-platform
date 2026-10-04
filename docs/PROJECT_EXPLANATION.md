# 🇮🇳 NIRIKSHAN (निरीक्षण) — Complete Project Documentation & Technical Dossier
> **Platform**: Smart Real-Time Monitoring, Surprise Inspection & AI Fraud Prevention Platform  
> **Initiative**: Smart India Hackathon (SIH 2026)  
> **Nodal Ministry**: Department of Social Justice & Empowerment (DoSJE), Government of India  
> **Core Mandate**: Eradicate ghost beneficiaries, stop grant diversion, enforce geo-verified inspections, and provide real-time CCTV surveillance across thousands of welfare institutions.

---

## 📋 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [High-Level Architecture & System Topology](#2-high-level-architecture--system-topology)
3. [The Three Architectural Pillars](#3-the-three-architectural-pillars)
   - [Pillar 1: Monitoring Matrix](#pillar-1-monitoring-matrix)
   - [Pillar 2: Intelligence & AI Fraud Engine (Rules 1–30)](#pillar-2-intelligence--ai-fraud-engine-rules-130)
   - [Pillar 3: Field Operations & Adjudication](#pillar-3-field-operations--adjudication)
4. [Flagship Innovations Deep Dive](#4-flagship-innovations-deep-dive)
   - [Android Smartphone as Live Edge CCTV Feed](#a-android-smartphone-as-live-edge-cctv-feed)
   - [Financial Intelligence & Grant Audit Engine (Rules 16–22)](#b-financial-intelligence--grant-audit-engine-rules-1622)
   - [Weighted Random Surprise Inspection Engine](#c-weighted-random-surprise-inspection-engine)
   - [Biometric Attendance AI (OpenCV YuNet + SFace)](#d-biometric-attendance-ai-opencv-yunet--sface)
   - [Surprise Video Conference (VC) Matrix](#e-surprise-video-conference-vc-matrix)
5. [Role-Based Access Control (RBAC) & Persona Switcher](#5-role-based-access-control-rbac--persona-switcher)
6. [Technology Stack & Monorepo Structure](#6-technology-stack--monorepo-structure)
7. [Comprehensive Demo Walkthrough Script](#7-comprehensive-demo-walkthrough-script)

---

## 1. Executive Summary & Problem Statement

### The Problem
Government departments and social welfare ministries disburse tens of thousands of crores annually in grants-in-aid to NGOs, vocational training centers, residential hostels, and welfare facilities. However, legacy oversight faces acute governance vulnerabilities:
1. **Ghost Beneficiaries & Attendance Inflation**: Rollcall registers manipulated manually; physical headcounts do not match claimed stipends and meal bills.
2. **Recycled Photographic Evidence**: Contractors and inspectors reusing old photographs from previous fiscal years or different sites.
3. **Collusion & Predictable Inspections**: Facilities receiving advance informal warnings before scheduled audits, masking non-compliance.
4. **Grant Diversion & Split Procurement**: Splitting large purchases into multiple sub-₹5,00,000 invoices to bypass open-tendering thresholds; fiscal year-end March rushes consuming funds without physical progress.
5. **Physical CCTV Hardware Deficit**: Many remote rural facilities lack expensive industrial IP cameras, making live remote spot-checks difficult.

### The Solution: NIRIKSHAN
**NIRIKSHAN** (meaning *vigilant inspection* in Sanskrit & Hindi) is an end-to-end, real-time monitoring and fraud adjudication ecosystem combining:
- **Server-Side Geospatial Geofencing**: Mandatory GPS lock within 250 meters of the facility to unlock digital inspection forms.
- **Computer Vision & Face Biometrics**: OpenCV YuNet + SFace neural networks analyzing group attendance photos against 128-dimensional biometric embeddings.
- **Rules 1–30 Automated Anomaly Engine**: Continuous statistical surveillance identifying duplicate invoices, sudden attendance spikes, CCTV downtime, and progress-spending deficits.
- **Zero-Hardware Mobile CCTV Streaming**: Allows any standard Android smartphone running over local Wi-Fi to serve as an authentic live surveillance camera with biometric telemetry and cryptographic evidence hashing.
- **Weighted Random Assignment Algorithm**: 6-factor probability engine selecting facilities for surprise inspections while excluding inspectors with regional conflicts of interest.

---

## 2. High-Level Architecture & System Topology

```
                                  ┌─────────────────────────────────────────┐
                                  │      NIRIKSHAN Command Center Web       │
                                  │      (React 18 + Vite + Tailwind CSS)   │
                                  └────────────────────┬────────────────────┘
                                                       │
                                      HTTPS REST API   │   Socket.IO (WSS)
                                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    NIRIKSHAN CORE API GATEWAY                                     │
│                                (Node.js + Express 4 + TypeScript)                                 │
│                                                                                                   │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────┐ │
│  │  JWT & RBAC Engine   │  │  Geospatial Engine    │  │  Weighted Random     │  │ Offline Sync │ │
│  │  (8 Roles + Scopes)  │  │  (2dsphere Indexing)  │  │  Assignment Engine   │  │ Idempotency  │ │
│  └──────────────────────┘  └───────────────────────┘  └──────────────────────┘  └──────────────┘ │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────┐ │
│  │  Cryptographic Hash  │  │  Mobile CCTV Proxy    │  │  Financial Engine    │  │ Server GPS   │ │
│  │  Evidence Integrity  │  │  (MJPEG / HTTP Relay) │  │  (Rules 16–22 Audit) │  │ Geofencing   │ │
│  └──────────────────────┘  └───────────────────────┘  └──────────────────────┘  └──────────────┘ │
└──────────────────┬───────────────────────┬────────────────────┬───────────────────┬───────────────┘
                   │                       │                    │                   │
                   ▼                       ▼                    ▼                   ▼
         ┌───────────────────┐   ┌───────────────────┐  ┌───────────────┐   ┌───────────────┐
         │    MongoDB 8.0    │   │  Local Storage /  │  │   Socket.IO   │   │  FastAPI AI   │
         │ (GeoJSON Projects │   │  Object Storage   │  │   Live Bus    │   │  Service      │
         │  + Audit Trail)   │   │ (SHA-256 Hashes)  │  │ (Heartbeats)  │   │ (Face & Rules)│
         └───────────────────┘   └───────────────────┘  └───────────────┘   └───────────────┘
                   ▲
                   │ Push/Pull Sync Batch
         ┌─────────┴─────────────────────────┐
         │     Field Inspector Mobile App    │
         │      (React Native / PWA)         │
         └───────────────────────────────────┘
```

---

## 3. The Three Architectural Pillars

NIRIKSHAN organizes governance workflows into three integrated pillars:

### Pillar 1: Monitoring Matrix
1. **GIS & Satellite Hybrid Map**:
   - Leaflet + Google Earth satellite imagery overlay.
   - Real-time rendering of all 20 monitored institutions across Maharashtra, Delhi, Karnataka, and Gujarat.
   - Visual 250m circular geofence boundary rings around all facilities.
   - Live location fixes of en-route and on-site field inspection officers.
2. **Institution & Project Registry**:
   - Profiles of implementing NGOs, PMU centers, and vocational institutes.
   - Linked schemes (e.g. *PMKVY 4.0*, *Jal Jeevan Mission*, *DDU-GKY*, *Poshan Abhiyaan*).
   - One-click slide-over Dossier Drawer showing linked beneficiaries, building CCTV feeds, and financial grants.
3. **Beneficiary Registry**:
   - Detailed citizen profiles (category: SC/ST/OBC/EWS, verified attendance sessions, photo hashes).
   - Cross-linked directly to their enrolled project facility and implementing organization.

### Pillar 2: Intelligence & AI Fraud Engine (Rules 1–30)
1. **Autonomous Anomaly Detection**:
   - **Rule 1–5 (Attendance)**: Muster roll vs. computer vision face count deficit, ghost beneficiary bursts, sudden weekend attendance anomalies.
   - **Rule 6–10 (Evidence)**: Recycled photos, duplicate perceptual image hashes, timestamp manipulation.
   - **Rule 11–15 (CCTV & Telemetry)**: Unexplained camera feed downtime, edge tampering, camera orientation shifts.
   - **Rule 16–22 (Financial Grants)**: Spending vs. verified physical progress mismatch, split invoices under tendering limits, March spending spikes.
   - **Rule 23–30 (Field Audits)**: Inspector geo-spoofing, rapid inspection completion (<10 mins), repeated assignment to same facility.
2. **Human-in-the-Loop Adjudication**:
   - Official review workflow: **Verify Authentic Anomaly**, **Dismiss False Positive**, **Dispatch Surprise Inspection**, or **Issue Corrective Action Directive**.

### Pillar 3: Field Operations & Adjudication
1. **Surprise Inspections Workflow**:
   - Digital inspection checklists tailored by scheme.
   - Real-time photo capture with server-side GPS extraction and SHA-256 evidence hashing.
2. **Corrective Action Directives**:
   - Time-bound rectification notices issued to non-compliant institutions with countdown SLAs (7 days / 14 days).
   - Status tracking (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `OVERDUE`).
3. **Ministry Gazette Compliance Tracker**:
   - Ingests official blacklisted/debarred NGO records.
   - Tracks debarment orders, grant suspensions, and recovery proceedings.
4. **Immutable Audit Trail**:
   - Append-only log recording actor, IP address, timestamp, role, and action payload for legal defensibility.

---

## 4. Flagship Innovations Deep Dive

### A. Android Smartphone as Live Edge CCTV Feed
To solve the lack of physical CCTV hardware in remote areas, NIRIKSHAN incorporates a universal HTTP/MJPEG streaming proxy:
1. **Zero Specialized Equipment**: Any Android phone running a free app like *IP Webcam* serves as a high-definition surveillance camera.
2. **Cross-Origin & Private Network Bypass**: Browsers typically block direct requests from `http://localhost` to local LAN IPs (`10.x.x.x` or `192.168.x.x`). NIRIKSHAN pipes the video through a backend proxy (`/api/v1/cctv/mobile-stream?url=...`), guaranteeing 100% reliable streaming.
3. **Automatic URL Normalization**: Automatically converts base IP entries (e.g. `http://10.146.163.75:8080`) to the raw video endpoint (`/video`).
4. **Edge AI Telemetry HUD**: Overlays real-time frame timestamps, simulated biometric bounding boxes, tamper status, and cryptographic evidence snapshot hashing.

### B. Financial Intelligence & Grant Audit Engine (Rules 16–22)
NIRIKSHAN provides deep forensic auditing of grant utilization:
- **Rule 21 (Progress Burn Deficit)**: Compares claimed expenditure velocity (e.g. 82% of funds consumed) against independently verified physical inspection completion (e.g. 43% milestone completion). Deficits exceeding 20% are flagged as high risk.
- **Rule 20 (Split Procurement Ceilings)**: Automatically scans invoice ledgers to detect consecutive purchases to the same vendor just below the ₹5,00,000 tendering limit.
- **Rule 19 (March Spending Spike)**: Detects fiscal year-end panic spending where >40% of the annual budget is burned in the final 10 days of March.
- **Itemized Budget Heads**: Tracks utilization across Infrastructure, Nutrition/Stipends, Tools, and Administrative Overheads.
- **Live AI Audit Report Modal**: Allows officials to run Rules 16–22 live against any facility, generating a 0–100 risk score and creating an `AnomalyAlert` in the Command Centre.

### C. Weighted Random Surprise Inspection Engine
Replaces predictable scheduled inspections with an algorithmic assignment model:
$$\text{Weight} = w_1 \cdot \text{RiskScore} + w_2 \cdot \text{DaysSinceLastInspection} + w_3 \cdot \text{AnomalyCount} - w_4 \cdot \text{InspectorProximity}$$
- **Conflict-of-Interest Filter**: Automatically excludes inspectors native to the target district.
- **Fraud Prevention**: Facilities cannot predict when an inspection will trigger.

### D. Biometric Attendance AI (OpenCV YuNet + SFace)
- **Face Detection (YuNet)**: Ultra-lightweight ONNX model detecting multiple faces in crowded classroom or hostel rollcall photos even in low-light environments.
- **Biometric Matching (SFace)**: Generates 128-dimensional facial feature vectors and calculates cosine similarity against enrolled beneficiary identity templates.
- **Attendance Verification**: Instantly flags if the count of verified faces is significantly lower than the claimed digital roster.

### E. Surprise Video Conference (VC) Matrix
- Allows DoSJE officials to initiate instantaneous, ad-hoc video spot-checks with facility superintendents.
- On-camera verification of live student headcount, pantry food stock, and staff presence with government ID.
- Automatically records discrepancies and triggers field inspections if non-compliance is spotted.

---

## 5. Role-Based Access Control (RBAC) & Persona Switcher

The platform features an instant **Evaluator Persona Switcher** in the top navigation bar, allowing evaluators to experience the platform through 8 distinct roles:

| Role Code | Title | Seeded Account | Special Capabilities |
|---|---|---|---|
| `SUPER_ADMIN` | National System Super Admin | `superadmin@nirikshan.gov.in` | Global administrative control, auto-assignment, CCTV control, system settings |
| `DEPARTMENT_OFFICIAL` | Joint Secretary (DoSJE HQ) | `dept.official1@nirikshan.gov.in` | National situational command, anomaly verification, corrective directives |
| `PMU_OFFICER` | Project Management Unit Lead | `pmu.officer@nirikshan.gov.in` | Project lifecycle management, financial audits, inspection triage |
| `PMU_INSPECTOR` | Ground Field Inspector | `inspector1@nirikshan.gov.in` | Mobile inspection execution, GPS lock, checklist submission, offline batch sync |
| `STATE_AUTHORITY` | State Monitoring Officer | `state.auth@nirikshan.gov.in` | State-level GIS oversight, regional compliance tracking |
| `DISTRICT_AUTHORITY` | District Collector (Pune) | `district.pune@nirikshan.gov.in` | District project risk review, localized inspection approvals |
| `NGO_ADMIN` | Implementing Partner Head | `ngo.admin1@nirikshan.gov.in` | Institution overview, AI attendance rollcall, staff check-in, GFR 12-A grant utilization |
| `BENEFICIARY` | Citizen Beneficiary | `beneficiary@nirikshan.gov.in` | Personal attendance logs, scheme entitlements, grievance submission |

*All seeded demo accounts use the standard password: `Password@123`*

---

## 6. Technology Stack & Monorepo Structure

### Workspace Organization
```
Nirikshan-Platform/
├── apps/
│   ├── admin-web/       # React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Leaflet
│   └── api/             # Node.js, Express, TypeScript, Mongoose, Socket.IO, Crypto
├── packages/
│   ├── shared-types/    # Shared TypeScript interfaces, Enums (Roles, Anomalies, Statuses)
│   └── validation/      # Zod validation schemas for all API payloads
├── services/
│   └── ai-service/      # Python 3.11, FastAPI, OpenCV (YuNet + SFace), NumPy
└── docs/                # Architecture, setup guides, and API specifications
```

---

## 7. Comprehensive Demo Walkthrough Script

To demonstrate the full power of NIRIKSHAN to evaluators:

1. **National Command Centre Overview**:
   - Log in as **Super Admin** (`superadmin@nirikshan.gov.in` / `Password@123`).
   - Open [http://localhost:5173/](http://localhost:5173/).
   - Highlight the **Google Earth Satellite Hybrid GIS Map** with geofence rings and live inspectors.
   - Review the high-level KPI metrics (20 Monitored Facilities, Active Missions, Online Cameras, Critical Fraud Anomalies).

2. **CCTV & Smartphone Surveillance**:
   - Click **CCTV & Surprise VC Matrix** in the sidebar.
   - Open **Mobile Phone Camera (Live Wi-Fi Surveillance)**.
   - Show live video streaming from the Android smartphone through the backend proxy.
   - Point to the AI overlay, live frame timestamp, and click **Snapshot** to demonstrate cryptographic SHA-256 evidence hashing.

3. **Financial Intelligence & Grant Audit Engine**:
   - Click **Financial Audits (Rules 16–22)** in the sidebar.
   - Review the ₹5.03 Crore grant summary and split invoice flags.
   - Click **Run Audit** on any facility (e.g. *PMKVY Multi-Skill Training Center Aundh*) to open the live **AI Audit Report Modal** displaying Rules 16–22 findings and progress-burn deficits.
   - Open the **Grant Ledger Dossier** to inspect itemized budget heads and invoices.
   - Click **Add Invoice** to demonstrate automated Rule 20 split-procurement ceiling breach detection and SHA-256 hashing.

4. **Facility Dossier & Beneficiary Cross-Linking**:
   - Click any project facility name in the table.
   - Observe the slide-over **Dossier Drawer** with linked building CCTV streams, enrolled beneficiaries, and live financial breakdown.
   - Click **Dossier →** on any beneficiary to view their verified attendance history and scheme entitlements.

5. **Weighted Random Surprise Assignment**:
   - Return to the **Command Centre**.
   - Click **Weighted Random Assignment**.
   - Select state (e.g. *Maharashtra*), choose *Surprise Spot-Check*, and click **Run Auto-Assignment**.
   - Watch the 6-factor algorithm assign inspectors while excluding regional conflicts of interest.

6. **Role Switching**:
   - Click **Persona Switcher** in the top bar.
   - Switch to **NGO / Institution Admin** to experience the institutional portal with AI rollcall and staff check-in.
   - Switch to **Field Inspector** to experience the mobile inspection checklist with GPS geofence verification.
