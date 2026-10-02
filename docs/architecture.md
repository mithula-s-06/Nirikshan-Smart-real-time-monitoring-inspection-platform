# NIRIKSHAN Platform — Architecture Overview

NIRIKSHAN is an enterprise AI-assisted real-time monitoring, surprise inspection, and CCTV surveillance platform built for government schemes, institutions, and monitoring agencies.

## System Topology

```
[ Inspector Mobile App ]        [ Admin Web Dashboard ]
       (React Native)                 (React + Vite)
              │                              │
              └──────────────┬───────────────┘
                             │ HTTPS / WSS
                             ▼
              ┌─────────────────────────────┐
              │     NIRIKSHAN API CORE      │
              │  (Node.js + Express + TS)   │
              │  - RBAC Security Middleware │
              │  - Rate Limiter & Helmet    │
              │  - Socket.IO Real-time Hub  │
              │  - Assignment Engine        │
              └──────────────┬──────────────┘
                             │
              ┌──────────────┼──────────────┬──────────────────┐
              ▼              ▼              ▼                  ▼
     ┌────────────────┐ ┌─────────┐ ┌───────────────┐ ┌────────────────┐
     │ MongoDB Cluster│ │  Redis  │ │  FastAPI AI   │ │ Object Storage │
     │  (GeoJSON +    │ │(Pub/Sub)│ │Anomalies/Rules│ │ (Local/S3/R2/  │
     │ 2dsphere index)│ └─────────┘ └───────────────┘ │     MinIO)     │
     └────────────────┘                               └────────────────┘
```

## Security & Compliance Architecture

- **Defense in Depth**: Every API endpoint independently enforces authentication, role verification, status validation, and resource tenant ownership.
- **Tamper-Evident Evidence**: Uploaded photos/videos generate SHA-256 integrity hashes upon ingestion.
- **Authoritative Geo-Verification**: Inspector GPS coordinates are verified server-side against project geospatial boundary definitions using spherical distance calculations.
- **Append-Only Audit Logs**: Every administrative and inspection action records actor, IP, timestamp, and request correlation IDs.
