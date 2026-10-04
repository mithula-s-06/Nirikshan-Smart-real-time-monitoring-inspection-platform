import axios from 'axios';
import FormData from 'form-data';
import { db } from '../db.js';
import { isWithinGeofence } from '../utils/geo.js';
import { computeSha256, computePHash, hammingDistance } from '../utils/hash.js';
import { runRulesForSession } from '../services/rulesEngine.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8008';

/**
 * Creates a new attendance session.
 * Rejects duplicate sessions for the same unit & type on the same day unless corrected.
 */
export async function createSession(req, res) {
  try {
    const { unitId, sessionType = 'Morning', date = new Date().toISOString().split('T')[0], reasonForCorrection } = req.body;

    if (!unitId) {
      return res.status(400).json({ error: 'unitId is required.' });
    }

    const unit = db.findById('units', unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found.' });
    }

    // Check if session already exists today for this type
    const existing = db.findOne('sessions', { unitId, sessionType, date });
    if (existing && !reasonForCorrection) {
      return res.status(409).json({
        error: 'A session for this type has already been submitted today.',
        existingSessionId: existing.id,
        requiresCorrectionReason: true
      });
    }

    const session = db.insert('sessions', {
      unitId,
      unitName: unit.name,
      sessionType,
      date,
      status: 'active', // active, final, corrected
      createdAt: new Date().toISOString(),
      reasonForCorrection: reasonForCorrection || null,
      photos: [],
      ticks: [],
      faceCount: 0,
      tickedCount: 0,
      verificationRatio: 0,
      attendanceRate: 0
    });

    return res.status(201).json({
      message: 'Session created successfully.',
      session
    });
  } catch (err) {
    console.error('createSession error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Uploads a group photo to an active session.
 * Checks geofence, image hash uniqueness, and AI face quality.
 */
export async function uploadSessionPhoto(req, res) {
  try {
    const { id } = req.params;
    const session = db.findById('sessions', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.status === 'final') {
      return res.status(400).json({ error: 'Cannot add photos to a finalized session.' });
    }

    const unit = db.findById('units', session.unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // Parse GPS metadata
    let gps = null;
    if (req.body.gps) {
      try {
        gps = typeof req.body.gps === 'string' ? JSON.parse(req.body.gps) : req.body.gps;
      } catch (e) {
        gps = null;
      }
    }

    // 1. Geofence Verification
    const geoCheck = isWithinGeofence(unit.location, gps);
    if (!geoCheck.valid) {
      // Record security alert
      db.insert('alerts', {
        unitId: unit.id,
        unitName: unit.name,
        sessionId: session.id,
        ruleCode: 'OFF_SITE_PHOTO',
        ruleName: 'Off-Site Geofence Breach',
        severity: 'high',
        message: `Photo captured outside geofence: ${geoCheck.message}`,
        metadata: { gps, unitLocation: unit.location, distance: geoCheck.distance },
        status: 'active',
        createdAt: new Date().toISOString()
      });

      // We allow upload if forced or return warning, but flag it
      if (req.body.strictGeofence === 'true') {
        return res.status(403).json({
          error: `Geofence violation: ${geoCheck.message}`,
          geoCheck
        });
      }
    }

    // 2. Compute SHA-256 & Perceptual Hash
    const imageBuffer = req.file.buffer;
    const sha256 = computeSha256(imageBuffer);
    const pHash = computePHash(imageBuffer);

    // Duplicate detection across past sessions
    const existingHashes = db.find('photo_hashes');
    const exactMatch = existingHashes.find(h => h.sha256 === sha256 && h.sessionId !== session.id);
    const nearMatch = existingHashes.find(h => h.sessionId !== session.id && hammingDistance(h.pHash, pHash) <= 4);

    if (exactMatch || nearMatch) {
      db.insert('alerts', {
        unitId: unit.id,
        unitName: unit.name,
        sessionId: session.id,
        ruleCode: 'DUPLICATE_PHOTO',
        ruleName: 'Duplicate Image Detected',
        severity: 'high',
        message: `Duplicate photo submitted! Image visually matches a photo from session ${exactMatch?.sessionId || nearMatch?.sessionId} on ${exactMatch?.date || nearMatch?.date}.`,
        metadata: { matchedSessionId: exactMatch?.sessionId || nearMatch?.sessionId, sha256 },
        status: 'active',
        createdAt: new Date().toISOString()
      });
    }

    // 3. Forward to Python AI Service for Face Detection & Quality Assessment
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: req.file.originalname || 'capture.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });

    let aiResult;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 15000
      });
      aiResult = aiResponse.data;
    } catch (aiErr) {
      console.error('AI Service Error:', aiErr.response?.data || aiErr.message);
      return res.status(502).json({
        error: 'AI face analysis service failed to process image.',
        details: aiErr.response?.data || aiErr.message
      });
    }

    // 4. Quality validation
    const quality = aiResult.quality || {};
    if (!quality.ok) {
      // Record poor quality attempt
      return res.status(422).json({
        error: `Photo quality rejected: ${quality.reason}`,
        quality,
        retakeRequired: true
      });
    }

    // 5. Store Photo record
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const photoRecord = {
      id: photoId,
      timestamp: new Date().toISOString(), // Server clock timestamp
      gps,
      geoCheck,
      sha256,
      pHash,
      faceCount: aiResult.faceCount,
      quality: aiResult.quality,
      faces: aiResult.faces || []
    };

    const updatedPhotos = [...(session.photos || []), photoRecord];
    db.update('sessions', session.id, { photos: updatedPhotos });

    // Store hash for cross-session duplicate monitoring
    db.insert('photo_hashes', {
      photoId,
      sessionId: session.id,
      unitId: unit.id,
      sha256,
      pHash,
      date: session.date
    });

    return res.status(200).json({
      message: 'Photo processed successfully.',
      photoId,
      faceCount: aiResult.faceCount,
      quality: aiResult.quality,
      faces: aiResult.faces?.map(f => ({ bbox: f.bbox, score: f.score })), // sanitize embeddings from direct response
      totalPhotosInSession: updatedPhotos.length
    });

  } catch (err) {
    console.error('uploadSessionPhoto error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Saves register tick marks for a specific photo.
 */
export async function saveTicks(req, res) {
  try {
    const { id } = req.params;
    const { photoId, participantIds = [] } = req.body;

    const session = db.findById('sessions', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const currentTicks = session.ticks || [];
    const filtered = currentTicks.filter(t => t.photoId !== photoId);
    filtered.push({
      photoId,
      participantIds,
      timestamp: new Date().toISOString()
    });

    db.update('sessions', session.id, { ticks: filtered });

    return res.status(200).json({
      message: 'Ticks saved successfully.',
      tickedCount: new Set(filtered.flatMap(t => t.participantIds)).size
    });
  } catch (err) {
    console.error('saveTicks error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Finalizes an attendance session:
 * 1. Performs cross-photo de-duplication
 * 2. Computes metrics (face count, ticked count, verification ratio, attendance rate)
 * 3. Sanitizes biometric embeddings (privacy)
 * 4. Runs anti-fraud rules & generates alerts
 */
export async function finalizeSession(req, res) {
  try {
    const { id } = req.params;
    const session = db.findById('sessions', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const unit = db.findById('units', session.unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found.' });
    }

    const allFaces = (session.photos || []).flatMap(p => p.faces || []);
    
    // Call Python de-duplication
    let uniqueFaces = allFaces;
    if (allFaces.length > 0) {
      try {
        const dedupeRes = await axios.post(`${AI_SERVICE_URL}/deduplicate`, {
          allFaces,
          threshold: 0.48
        });
        uniqueFaces = dedupeRes.data.uniqueFaces || [];
      } catch (err) {
        console.warn('AI deduplication failed, using raw faces count:', err.message);
      }
    }

    const faceCount = uniqueFaces.length;
    const distinctTickedIds = Array.from(new Set((session.ticks || []).flatMap(t => t.participantIds || [])));
    const tickedCount = distinctTickedIds.length;

    const verificationRatio = tickedCount > 0 ? Number((faceCount / tickedCount).toFixed(3)) : 0;
    const registeredCount = db.count('participants', { unitId: session.unitId, status: 'active' }) || unit.activeParticipantsCount || 30;
    const attendanceRate = registeredCount > 0 ? Number((tickedCount / registeredCount).toFixed(3)) : 0;

    // Privacy safeguard: Remove biometric embeddings from storage
    const sanitizedPhotos = (session.photos || []).map(p => ({
      ...p,
      faces: (p.faces || []).map(f => ({
        bbox: f.bbox,
        score: f.score,
        width: f.width,
        height: f.height
        // embedding explicitly omitted
      }))
    }));

    const finalizedSession = db.update('sessions', session.id, {
      status: 'final',
      faceCount,
      tickedCount,
      verificationRatio,
      attendanceRate,
      registeredCount,
      finalizedAt: new Date().toISOString(),
      photos: sanitizedPhotos
    });

    // Update participant attendance records
    const allParticipants = db.find('participants', { unitId: session.unitId });
    for (const p of allParticipants) {
      const isPresent = distinctTickedIds.includes(p.id);
      const consecutiveAbsentDays = isPresent ? 0 : ((p.consecutiveAbsentDays || 0) + 1);
      const totalPresent = (p.totalPresent || 0) + (isPresent ? 1 : 0);
      const totalWorkingDays = (p.totalWorkingDays || 0) + 1;
      
      db.update('participants', p.id, {
        consecutiveAbsentDays,
        totalPresent,
        totalWorkingDays,
        lastAttendedDate: isPresent ? session.date : (p.lastAttendedDate || null)
      });
    }

    // Run Rule Engine
    const alerts = await runRulesForSession(session.unitId, finalizedSession);

    return res.status(200).json({
      message: 'Session finalized successfully.',
      session: finalizedSession,
      summary: {
        faceCount,
        tickedCount,
        verificationRatio,
        attendanceRate,
        fraudAlertsRaised: alerts.length
      },
      alerts
    });
  } catch (err) {
    console.error('finalizeSession error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * List sessions with optional filters.
 */
export function getSessions(req, res) {
  try {
    const { unitId, date, status } = req.query;
    const query = {};
    if (unitId) query.unitId = unitId;
    if (date) query.date = date;
    if (status) query.status = status;

    const sessions = db.find('sessions', query)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get single session by ID.
 */
export function getSessionById(req, res) {
  try {
    const session = db.findById('sessions', req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    const alerts = db.find('alerts', { sessionId: session.id });
    return res.json({ session, alerts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
