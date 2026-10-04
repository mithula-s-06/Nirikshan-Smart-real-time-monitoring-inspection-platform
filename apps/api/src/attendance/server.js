import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { seedDatabase } from './seed.js';
import {
  createSession,
  uploadSessionPhoto,
  saveTicks,
  finalizeSession,
  getSessions,
  getSessionById
} from './controllers/sessionController.js';
import { staffCheckin, getStaffCheckins } from './controllers/staffController.js';
import {
  getUnits,
  getUnitById,
  getParticipants,
  updateParticipantReason,
  getAlerts,
  updateAlert,
  getDashboardSummary,
  triggerDailyJob
} from './controllers/dashboardController.js';
import {
  analyzeIntegrityEndpoint,
  getIntegrityBenchmark,
  runBenchmarkEvaluation,
  getIntegrityConfig
} from './controllers/dataIntegrityController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Configure multer for in-memory file uploads (max 20MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Initialize seed data if units table is empty
if (db.count('units') === 0) {
  seedDatabase();
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Institutional Attendance & Beneficiary Data Integrity API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Session Endpoints (Attendance Module)
app.post('/api/sessions', createSession);
app.get('/api/sessions', getSessions);
app.get('/api/sessions/:id', getSessionById);
app.post('/api/sessions/:id/photos', upload.single('image'), uploadSessionPhoto);
app.post('/api/sessions/:id/ticks', saveTicks);
app.post('/api/sessions/:id/finalize', finalizeSession);

// Staff Check-in Endpoints
app.post('/api/staff/checkin', upload.single('image'), staffCheckin);
app.get('/api/staff/checkins', getStaffCheckins);

// Units & Participants Endpoints
app.get('/api/units', getUnits);
app.get('/api/units/:id', getUnitById);
app.get('/api/participants', getParticipants);
app.post('/api/participants/:id/reason', updateParticipantReason);

// Alerts & Fraud Dashboard Endpoints
app.get('/api/alerts', getAlerts);
app.patch('/api/alerts/:id', updateAlert);
app.get('/api/dashboard/summary', getDashboardSummary);
app.post('/api/jobs/daily', triggerDailyJob);

// Beneficiary Data Integrity Module Endpoints (Rules 2 - 8)
app.post('/api/integrity/analyze', analyzeIntegrityEndpoint);
app.get('/api/integrity/benchmark', getIntegrityBenchmark);
app.post('/api/integrity/run-benchmark', runBenchmarkEvaluation);
app.get('/api/integrity/config', getIntegrityConfig);

// Evaluator Demo Seed Reset Endpoint
app.post('/api/demo/seed', (req, res) => {
  seedDatabase();
  res.json({ message: 'Demo environment successfully reset and seeded.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✓ Institutional & Beneficiary Data Integrity Backend running on http://127.0.0.1:${PORT}`);
});
