# NIRIKSHAN Platform — API Reference Standard

All REST API endpoints conform to `/api/v1` base paths and standard JSON response envelopes.

## Standard Success Envelope

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "GEO_VERIFICATION_ERROR",
    "message": "GPS geo-verification failed. Inspector is outside required perimeter.",
    "details": { "distanceMeters": 420, "allowedRadius": 200 },
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Core API Routing Matrix

| Resource | Method | Path | Role Authorization |
|---|---|---|---|
| Health | GET | `/api/v1/health` | Public |
| Auth Login | POST | `/api/v1/auth/login` | Public |
| Auth Refresh | POST | `/api/v1/auth/refresh` | Authenticated |
| Auth Me | GET | `/api/v1/auth/me` | Authenticated |
| Projects | GET/POST | `/api/v1/projects` | Department / PMU / Super Admin |
| Inspections | GET/POST | `/api/v1/inspections` | Inspector / Officials |
| Evidence | POST | `/api/v1/inspections/:id/evidence` | Inspector |
| Alerts | GET | `/api/v1/alerts` | Officials / Admins |
| CCTV | GET | `/api/v1/cctv` | Authorized Monitors |
| Audit Logs | GET | `/api/v1/audit-logs` | Super Admin / Audit Officials |
