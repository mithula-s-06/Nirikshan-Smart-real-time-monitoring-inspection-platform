# 🇮🇳 NIRIKSHAN (निरीक्षण) — Smart Real-Time Monitoring & Inspection Platform
> **Smart India Hackathon (SIH 2026)** | Problem Statement: AI-Assisted Geofenced Monitoring & Anomaly Detection for Government Projects & Beneficiaries

---

## 🌟 Executive Summary
**NIRIKSHAN** is an enterprise-grade, offline-first, AI-assisted real-time monitoring and inspection platform engineered for government ministries, state departments, project management units (PMU), training institutes, and ground inspection officers.

It solves critical challenges in government project governance:
- **Ghost Beneficiaries & Attendance Fraud**: Automated ML attendance deficit cross-matching between physical head counts and digital muster rolls.
- **Recycled Photographic Evidence**: Multi-layer cryptographic SHA-256 and perceptual hash deduplication.
- **Biased / Collusive Inspections**: 6-factor algorithmic **Weighted Random Inspection Assignment Engine** with conflict-of-interest exclusion.
- **Remote Site Verification**: Authoritative server-side **Haversine Geofence Verification** (sub-250m accuracy required to unlock inspections).
- **Intermittent Connectivity**: Battle-tested offline-first synchronization engine with 48-hour MongoDB idempotency keys and client conflict resolution.
- **Edge CCTV Stream Integration**: Tokenized HMAC proxy streams delivering HLS live video directly to the command dashboard.

---

## 🏗 System Architecture

```
                                  +---------------------------------------+
                                  |     NIRIKSHAN Admin Command Center    |
                                  |   (React 18 + Vite + SVG GIS Maps)    |
                                  +-------------------+-------------------+
                                                      |
                                    REST API / HTTPS  |  Socket.IO (WSS)
                                                      v
+---------------------------------------------------------------------------------------------------+
|                                  NIRIKSHAN CORE API GATEWAY                                       |
|                               (Node.js + Express 4 + TypeScript)                                  |
|                                                                                                   |
|  +---------------------+  +----------------------+  +---------------------+  +------------------+ |
|  |  JWT Auth & RBAC    |  |  Geospatial Projects |  |  Weighted Random    |  | Offline Sync     | |
|  |  (5 Roles + Audit)  |  |  (2dsphere Indexing) |  |  Assignment Engine  |  | (Idempotency)    | |
|  +---------------------+  +----------------------+  +---------------------+  +------------------+ |
|  +---------------------+  +----------------------+  +---------------------+  +------------------+ |
|  |  SHA-256 Evidence   |  |  CCTV HMAC Proxy     |  |  Real-Time Socket   |  | Server-Side GPS  | |
|  |  Tamper Detection   |  |  (HLS Live Streams)  |  |  Telemetry Rooms    |  | Geofencing       | |
|  +---------------------+  +----------------------+  +---------------------+  +------------------+ |
+------------------+-----------------------+-------------------+--------------------+---------------+
                   |                       |                   |                    |
                   v                       v                   v                    v
         +-------------------+   +--------------------+  +-----------+    +--------------------+
         |   MongoDB 8.0     |   |   Local Storage /  |  | Socket.IO |    | Python 3.11        |
         |   (GeoJSON Data   |   |   AWS S3 Bucket    |  | Live Bus  |    | FastAPI AI Engine  |
         |   + Audit Logs)   |   |   (SHA-256 Hashes) |  | (GPS/Logs)|    | (Anomaly Signals)  |
         +-------------------+   +--------------------+  +-----------+    +--------------------+
                   ^
                   | Push/Pull Sync Batch
         +---------+--------------------------+
         |     NIRIKSHAN Mobile App           |
         |  (React Native Offline Sync Store) |
         +------------------------------------+
```

---

## 🔑 Demo Access Credentials (Pre-Seeded)

All seeded demo accounts use the standard password: **`Password@123`**

| Role | Name | Email Address | Access Scope |
|---|---|---|---|
| **SUPER_ADMIN** | National System Super Admin | `superadmin@nirikshan.gov.in` | Global administrative control, system config, auto-assignment engine |
| **DEPARTMENT_OFFICIAL** | Dr. Rajesh Verma (Joint Secretary) | `dept.official1@nirikshan.gov.in` | State monitoring, inspection approval, audit logs |
| **PMU_OFFICER** | Vikramaditya Sengupta (PMU Lead) | `pmu.officer@nirikshan.gov.in` | Project lifecycle management, anomaly triage & resolution |
| **INSPECTOR** | Amitabh Sharma (Field Inspector - MH) | `inspector1@nirikshan.gov.in` | Mobile inspection execution, GPS verify, evidence uploads |
| **INSPECTOR** | Priya Deshmukh (Field Inspector - MH) | `inspector2@nirikshan.gov.in` | Mobile inspection execution, offline sync |
| **STATE_AUTHORITY** | State Monitoring Commissioner (MH) | `state.auth@nirikshan.gov.in` | State-level GIS oversight and regional analytics |
| **DISTRICT_AUTHORITY** | District Collector Pune | `district.pune@nirikshan.gov.in` | District project and risk level management |
| **INSTITUTE_ADMIN** | Principal NSTI Pune | `institute.admin1@nirikshan.gov.in` | Institute compliance and attendance rolls |

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v25.x / v20.x)
- **npm**: v9+
- **MongoDB**: Local `mongodb://127.0.0.1:27017/nirikshan_db` (or connection URI in `.env`)

### 2. Monorepo Setup & Dependency Installation
```bash
# Clone and install dependencies across all workspaces
npm install
```

### 3. Build Shared Packages
```bash
npm run build:packages
```

### 4. Seed Database with Realistic Demo Data
```bash
npm run seed
```
*Seeds 13 role-based users, 10 organizations, 20 geo-tagged projects across India, standard inspection checklists, active inspections, 6 CCTV edge stream cameras, 4 AI anomaly alerts, and cryptographic evidence hashes.*

### 5. Launch Backend REST & Socket Server
```bash
npm run dev:api
```
*API running at `http://localhost:5000` with WebSocket telemetry at `ws://localhost:5000`.*

### 6. Launch Admin Web Command Center
```bash
npm run dev:admin
```
*Admin Dashboard running at `http://localhost:5173`.*

---

## 🧪 Comprehensive Automated Test Suites (100% Pass Rate)

NIRIKSHAN includes 8 comprehensive integration and unit test suites covering 178 automated assertions:

```bash
# Run entire test suite (all 178 tests)
npm test

# Run individual test suites:
npm run test:auth         # 20 tests: JWT rotation, replay attack defense, RBAC guards
npm run test:projects     # 21 tests: Geospatial $near queries, GeoJSON validation
npm run test:inspections  # 22 tests: 6-Factor Weighted Random Engine, GPS geofence checks
npm run test:evidence     # 18 tests: Multi-storage, SHA-256 hash tamper verification
npm run test:sync         # 17 tests: Delta pull, batch push, 48h MongoDB idempotency keys
npm run test:socket       # 12 tests: Handshake JWT auth, room routing, live GPS tracking
npm run test:anomaly      # 35 tests: ML attendance deficit, velocity divergence, photo fraud
npm run test:cctv         # 33 tests: Edge heartbeat telemetry, HMAC stream tokens, HLS playlists
```

```bash
# Run strict TypeScript type check across all monorepo workspaces
npm run type-check
```

---

## 🛰 Core Feature Matrix

### 1. 6-Factor Weighted Random Inspection Assignment
Avoids inspector predictability and collusion by scoring available inspectors across 6 weighted factors:
1. **Distance Proximity** (25%): Proximity to site via Haversine calculation.
2. **Workload Balancing** (20%): Balances active and pending assignments.
3. **Specialization Fit** (20%): Matches project category (Civil, IT, Electrical, Healthcare).
4. **Historical Quality Score** (15%): Inspector thoroughness rating.
5. **Conflict of Interest Check** (10%): Strictly excludes inspectors from their home district or prior associations.
6. **Controlled Random Perturbation** (10%): Dynamic seed ensuring unpredictable surprise visits.

### 2. Cryptographic Evidence Integrity (`/verify-hash`)
- On upload, the server calculates a **SHA-256 hash** directly from the binary buffer and persists it to the database record.
- The `/api/v1/evidence/:id/verify-hash` endpoint re-streams the file from storage (Local or S3), recalculates the hash in real-time, and verifies bit-for-bit authenticity against tampering.

### 3. Server-Side GPS Geofence Verification
- Inspectors cannot start an inspection or upload evidence unless their latitude/longitude is mathematically proven to be within the project's perimeter (default: 250 meters).
- Coordinates are logged with timestamp, accuracy, and stage history in the MongoDB audit trail.

### 4. Explainable AI & Anomaly Radar
- **Attendance Deficit Detector**: Calculates percentage deviation between claimed stipend muster rolls and physical head counts with confidence scores.
- **Velocity Divergence Detector**: Compares financial disbursement rate against physical completion milestones.
- **Duplicate Photo Fraud**: Flags recycled images using perceptual hashing and SHA-256 match tracking across different dates and locations.

### 5. Edge CCTV Surveillance Wall & Tokenized Streams
- Registers RTSP/HLS streams with geo-pins, model numbers, FPS, resolution, and CPU/memory telemetry.
- Generates expiring HMAC playback tokens (`/stream-token`) and delivers live HLS M3U8 playlists directly to the browser.

---

## 📂 Repository Structure

```
├── apps/
│   ├── api/                    # Express 4 + TypeScript + Mongoose Backend
│   │   └── src/
│   │       ├── config/         # Database, storage, and server config
│   │       ├── controllers/    # Auth, Projects, Inspections, Evidence, Sync, CCTV, Anomaly
│   │       ├── middleware/     # JWT Auth, RBAC guard, Idempotency, Request validation
│   │       ├── models/         # 11 Mongoose schema definitions (2dsphere indexes)
│   │       ├── routes/         # REST API routes (v1)
│   │       ├── services/       # Weighted Random Engine, Sync, Storage, CCTV, Anomaly
│   │       ├── socket/         # Socket.IO telemetry and room managers
│   │       ├── seed/           # High-fidelity realistic demo seed script
│   │       └── tests/          # 8 End-to-end integration test suites (178 tests)
│   ├── admin-web/              # React 18 + Vite Web Application
│   │   └── src/
│   │       ├── App.tsx         # Full 6-view command center (GIS Map, Video Wall, AI Radar)
│   │       ├── services/api.ts # Typed Axios REST & Auth API client
│   │       └── socket.ts       # Real-time WebSocket connection manager
│   ├── ai-service/             # Python FastAPI Anomaly Analytics Microservice
│   │   └── app/
│   │       └── main.py         # Anomaly detectors with Pydantic validation
│   └── mobile/                 # React Native Mobile Workspace (useSyncStore offline-first)
├── packages/
│   ├── shared-types/           # Shared TypeScript interfaces, enums, API types
│   └── validation/             # Shared Zod validation schemas
└── package.json                # Monorepo workspaces & scripts
```

---

## 🏆 Smart India Hackathon Presentation Flow

1. **Login as Super Admin** (`superadmin@nirikshan.gov.in` / `Password@123`).
2. **Interactive Live GIS Command Map**:
   - View 20 national projects color-coded by risk level across Maharashtra, Karnataka, Delhi, and Gujarat.
   - Inspect geofence halos, CCTV camera nodes, and live field inspectors streaming GPS telemetry.
3. **Trigger Weighted Random Assignment Engine**:
   - Open Inspections view -> Click "🎲 Run Weighted Random Assignment".
   - View explainable score breakdown with conflict-of-interest exclusion in real-time.
4. **AI Anomaly & Fraud Radar**:
   - Inspect the critical Attendance Deficit alert (54% ghost enrollment anomaly).
   - Test the interactive Attendance Deficit Simulator.
   - Click "Resolve Alert" to test one-click administrative action.
5. **CCTV Surveillance Video Wall**:
   - View multi-camera matrix -> Click "Live Stream" on Pune Mechatronics Lab.
   - Inspect tokenized HMAC stream proxy and live HLS stream player.
6. **Evidentiary Integrity**:
   - Demonstrate `/api/v1/evidence/:id/verify-hash` returning 100% bit-level cryptographic proof of tamper-free evidence.

---

## 📄 License
NIRIKSHAN Platform — Built for Smart India Hackathon (SIH 2026). All Rights Reserved.
