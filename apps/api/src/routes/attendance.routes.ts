import { Router } from 'express';
import multer from 'multer';
import {
  createSession,
  uploadSessionPhoto,
  saveTicks,
  finalizeSession,
  getSessions,
  getSessionById
} from '../attendance/controllers/sessionController.js';
import { staffCheckin, getStaffCheckins } from '../attendance/controllers/staffController.js';
import {
  getUnits,
  getUnitById,
  getParticipants,
  updateParticipantReason,
  getAlerts,
  updateAlert,
  getDashboardSummary,
  triggerDailyJob
} from '../attendance/controllers/dashboardController.js';
import {
  analyzeIntegrityEndpoint,
  getIntegrityBenchmark,
  runBenchmarkEvaluation,
  getIntegrityConfig
} from '../attendance/controllers/dataIntegrityController.js';
import { seedDatabase } from '../attendance/seed.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const router = Router();

// Sessions
router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSessionById);
router.post('/sessions/:id/photos', upload.single('image'), uploadSessionPhoto);
router.post('/sessions/:id/ticks', saveTicks);
router.post('/sessions/:id/finalize', finalizeSession);

// Staff Check-in
router.post('/staff/checkin', upload.single('image'), staffCheckin);
router.get('/staff/checkins', getStaffCheckins);

// Units & Beneficiaries
router.get('/units', getUnits);
router.get('/units/:id', getUnitById);
router.get('/participants', getParticipants);
router.post('/participants/:id/reason', updateParticipantReason);

// Alerts & Dashboard Summary
router.get('/alerts', getAlerts);
router.patch('/alerts/:id', updateAlert);
router.get('/dashboard/summary', getDashboardSummary);
router.post('/jobs/daily', triggerDailyJob);

// Integrity Engine (Rules 2-8)
router.post('/integrity/analyze', analyzeIntegrityEndpoint);
router.get('/integrity/benchmark', getIntegrityBenchmark);
router.post('/integrity/run-benchmark', runBenchmarkEvaluation);
router.get('/integrity/config', getIntegrityConfig);

// Evaluator Demo Seed Reset
router.post('/demo/seed', (_req, res) => {
  seedDatabase();
  res.json({ success: true, message: 'Demo environment successfully reset and seeded.' });
});

export default router;
