# NIRIKSHAN Platform — Database Schema & Indexing Guide

The primary data store is MongoDB with geospatial indexing enabled.

## Geospatial Indexing

Every project, CCTV camera, and inspection location is indexed using MongoDB's `2dsphere` index to facilitate fast proximity calculations, geofence validations, and spatial bounding box queries.

```javascript
// Example MongoDB Indexes
db.projects.createIndex({ location: "2dsphere" });
db.projects.createIndex({ state: 1, district: 1, status: 1 });
db.inspections.createIndex({ projectId: 1, inspectorId: 1, status: 1 });
db.alerts.createIndex({ projectId: 1, severity: 1, status: 1 });
db.evidence.createIndex({ inspectionId: 1, capturedAt: -1 });
db.audit_logs.createIndex({ timestamp: -1, actorId: 1 });
```

## Schema Entities

1. `users`: System users with hashed passwords and RBAC roles.
2. `organizations`: Government departments, institutes, NGOs.
3. `projects`: Monitored initiatives with GeoJSON point coordinates.
4. `inspections`: Multi-stage inspection workflows and logs.
5. `checklists`: Configurable question templates with photo requirements.
6. `evidence`: Media metadata and SHA-256 hash chains.
7. `cctv_cameras`: Camera registry and stream access proxies.
8. `anomaly_alerts`: AI and rule engine anomaly detections.
9. `audit_logs`: Immutable security action records.
