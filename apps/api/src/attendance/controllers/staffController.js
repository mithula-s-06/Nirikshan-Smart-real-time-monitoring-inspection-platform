import axios from 'axios';
import FormData from 'form-data';
import { db } from '../db.js';
import { isWithinGeofence } from '../utils/geo.js';
import { computeSha256 } from '../utils/hash.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8008';

/**
 * Handles live staff check-in with selfie, GPS verification, mock location check and single face validation.
 */
export async function staffCheckin(req, res) {
  try {
    const { staffId = 'staff_01', staffName = 'Officer / Staff Member', unitId } = req.body;

    if (!unitId) {
      return res.status(400).json({ error: 'unitId is required.' });
    }

    const unit = db.findById('units', unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Live selfie photo is required for check-in.' });
    }

    // Parse GPS
    let gps = null;
    if (req.body.gps) {
      try {
        gps = typeof req.body.gps === 'string' ? JSON.parse(req.body.gps) : req.body.gps;
      } catch (e) {
        gps = null;
      }
    }

    if (!gps) {
      return res.status(400).json({ error: 'GPS location coordinates are required.' });
    }

    // 1. Anti-Mock Location Check
    if (gps.isMock === true || gps.mocked === true) {
      db.insert('alerts', {
        unitId: unit.id,
        unitName: unit.name,
        ruleCode: 'MOCK_LOCATION_DETECTED',
        ruleName: 'Mock Location Spoofing Attempt',
        severity: 'high',
        message: `Staff check-in for ${staffName} rejected: Mock location provider detected on device.`,
        metadata: { staffId, staffName, gps },
        status: 'active',
        createdAt: new Date().toISOString()
      });
      return res.status(403).json({
        error: 'Spoofed or Mock Location detected. Check-in rejected.',
        isMock: true
      });
    }

    // 2. GPS Accuracy Check
    if (gps.accuracy && gps.accuracy > 75) {
      return res.status(400).json({
        error: `GPS accuracy too low (${gps.accuracy}m). Please wait for better satellite fix.`,
        accuracy: gps.accuracy
      });
    }

    // 3. Geofence Verification
    const geoCheck = isWithinGeofence(unit.location, gps);
    if (!geoCheck.valid) {
      db.insert('alerts', {
        unitId: unit.id,
        unitName: unit.name,
        ruleCode: 'OFF_SITE_PHOTO',
        ruleName: 'Staff Off-Site Check-in',
        severity: 'high',
        message: `Staff check-in failed for ${staffName}: ${geoCheck.message}`,
        metadata: { staffId, staffName, distance: geoCheck.distance },
        status: 'active',
        createdAt: new Date().toISOString()
      });
      return res.status(403).json({
        error: `Check-in rejected: Location is outside the institutional premises. (${geoCheck.message})`,
        geoCheck
      });
    }

    // 4. AI Selfie Analysis (Single Face Verification)
    const imageBuffer = req.file.buffer;
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: req.file.originalname || 'selfie.jpg',
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
      return res.status(502).json({
        error: 'AI face verification service error.',
        details: aiErr.message
      });
    }

    // 5. Verify Exactly One Face in Selfie
    const faceCount = aiResult.faceCount || 0;
    if (faceCount !== 1) {
      const msg = faceCount === 0
        ? 'No face detected in selfie. Please ensure your face is clearly visible in the camera.'
        : `Multiple faces (${faceCount}) detected in selfie. Only one person must be in the check-in photo.`;
      return res.status(422).json({
        error: msg,
        faceCount,
        quality: aiResult.quality
      });
    }

    // 6. Save Check-in
    const checkin = db.insert('staff_checkins', {
      staffId,
      staffName,
      unitId: unit.id,
      unitName: unit.name,
      timestamp: new Date().toISOString(), // Server clock time
      gps,
      distanceFromCenter: geoCheck.distance,
      sha256: computeSha256(imageBuffer),
      quality: aiResult.quality,
      status: 'verified'
    });

    return res.status(201).json({
      message: 'Staff check-in verified and recorded successfully.',
      checkin
    });

  } catch (err) {
    console.error('staffCheckin error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * List all staff check-ins.
 */
export function getStaffCheckins(req, res) {
  try {
    const { unitId, date } = req.query;
    const query = {};
    if (unitId) query.unitId = unitId;

    let checkins = db.find('staff_checkins', query)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (date) {
      checkins = checkins.filter(c => c.timestamp.startsWith(date));
    }

    return res.json({ checkins });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
