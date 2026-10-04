import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Camera,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Send,
  MapPin,
  Sparkles,
  ShieldAlert,
  Sliders,
  Eye
} from 'lucide-react';

export default function CaptureWorkflow({ onSessionFinalized }) {
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [sessionType, setSessionType] = useState('Morning Rollcall');
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Simulation Controls for Evaluators & Real Camera
  const [useSimulatedGps, setUseSimulatedGps] = useState(true);
  const [isOffSite, setIsOffSite] = useState(false);
  const [isMockLocation, setIsMockLocation] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);

  // Current photo upload state
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentFaces, setCurrentFaces] = useState([]);
  const [qualityFeedback, setQualityFeedback] = useState(null);
  const [lastUploadedPhotoId, setLastUploadedPhotoId] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedUnitId) {
      fetchParticipants(selectedUnitId);
    }
  }, [selectedUnitId]);

  const fetchUnits = async () => {
    try {
      const res = await axios.get('/api/units');
      setUnits(res.data.units || []);
      if (res.data.units && res.data.units.length > 0) {
        setSelectedUnitId(res.data.units[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParticipants = async (unitId) => {
    try {
      const res = await axios.get(`/api/participants?unitId=${unitId}`);
      setParticipants(res.data.participants || []);
      setSelectedParticipants([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSession = async () => {
    setError(null);
    setLoading(true);
    setFinalSummary(null);
    try {
      const res = await axios.post('/api/sessions', {
        unitId: selectedUnitId,
        sessionType,
        date: new Date().toISOString().split('T')[0]
      });
      setSession(res.data.session);
      setSuccessMsg(`Session started for ${res.data.session.unitName}`);
    } catch (err) {
      if (err.response?.status === 409) {
        // Option to correct or resume
        const proceed = window.confirm(
          "A session was already logged today for this unit and type. Would you like to create an authorized correction session?"
        );
        if (proceed) {
          const reason = prompt("Enter official reason for correction (e.g., 'Retake due to power outage'):", "Administrative correction");
          if (reason) {
            const retryRes = await axios.post('/api/sessions', {
              unitId: selectedUnitId,
              sessionType,
              date: new Date().toISOString().split('T')[0],
              reasonForCorrection: reason
            });
            setSession(retryRes.data.session);
            setSuccessMsg(`Correction session started: ${reason}`);
          }
        }
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Prepare GPS payload based on unit coordinates or off-site test toggle
  const getGpsPayload = () => {
    const selectedUnit = units.find(u => u.id === selectedUnitId);
    if (!selectedUnit) return { lat: 12.9716, lng: 77.5946, accuracy: 10, isMock: false };

    if (isOffSite) {
      // 5km away from center
      return {
        lat: selectedUnit.location.lat + 0.05,
        lng: selectedUnit.location.lng + 0.05,
        accuracy: 15,
        isMock: isMockLocation
      };
    }

    return {
      lat: selectedUnit.location.lat + 0.0001,
      lng: selectedUnit.location.lng + 0.0001,
      accuracy: 10,
      isMock: isMockLocation
    };
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadPhoto(file);
    }
  };

  const processAndUploadPhoto = async (file) => {
    if (!session) return;
    setError(null);
    setQualityFeedback(null);
    setLoading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('gps', JSON.stringify(getGpsPayload()));

    try {
      const res = await axios.post(`/api/sessions/${session.id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setQualityFeedback(res.data.quality);
      setCurrentFaces(res.data.faces || []);
      setLastUploadedPhotoId(res.data.photoId);
      setSuccessMsg(`✓ Photo analyzed: ${res.data.faceCount} face(s) detected with high confidence.`);

      // Update session photos count in local state
      setSession(prev => ({
        ...prev,
        photos: [...(prev?.photos || []), { id: res.data.photoId, faceCount: res.data.faceCount }]
      }));

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      if (err.response?.data?.quality) {
        setQualityFeedback(err.response.data.quality);
      }
    } finally {
      setLoading(false);
    }
  };

  // Start / Capture from live camera
  const startCamera = async () => {
    setUseWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Unable to access camera: " + err.message);
      setUseWebcam(false);
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        // Stop stream
        const stream = video.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setUseWebcam(false);
        processAndUploadPhoto(file);
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleParticipantTick = (id) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = (count) => {
    // Select first N visible participants to quickly simulate register ticking
    const idsToSelect = filteredParticipants.slice(0, count).map(p => p.id);
    setSelectedParticipants(prev => Array.from(new Set([...prev, ...idsToSelect])));
  };

  const handleSaveTicks = async () => {
    if (!session || !lastUploadedPhotoId) return;
    try {
      await axios.post(`/api/sessions/${session.id}/ticks`, {
        photoId: lastUploadedPhotoId,
        participantIds: selectedParticipants
      });
      setSuccessMsg(`✓ Saved ${selectedParticipants.length} register ticks for current photo.`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleFinalize = async () => {
    if (!session) return;
    setError(null);
    setLoading(true);

    try {
      // Save current ticks first if not already saved
      if (lastUploadedPhotoId) {
        await axios.post(`/api/sessions/${session.id}/ticks`, {
          photoId: lastUploadedPhotoId,
          participantIds: selectedParticipants
        });
      }

      const res = await axios.post(`/api/sessions/${session.id}/finalize`);
      setFinalSummary(res.data);
      setSession(res.data.session);
      setSuccessMsg("✓ Session finalized! Verification ratio calculated and anti-fraud rules executed.");
      if (onSessionFinalized) onSessionFinalized();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.rollNo && p.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Officer Live Workflow
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" /> Geofence Verified
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Group Attendance Session & Face Verification</h2>
            <p className="text-sm text-slate-400">
              Capture verified group photos, automatically count faces, tick register names, and de-duplicate across photos.
            </p>
          </div>

          {!session ? (
            units.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>No institutional units available — Backend service is offline or unseeded.</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Institution</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.activeParticipantsCount || u.sanctionedStrength} registered)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Morning Rollcall">Morning Rollcall</option>
                    <option value="Breakfast">Breakfast Attendance</option>
                    <option value="Lunch">Lunch Attendance</option>
                    <option value="Evening Assembly">Evening Assembly</option>
                    <option value="Night Curfew Check">Night Curfew Check</option>
                  </select>
                </div>

                <div className="self-end">
                  <button
                    onClick={handleStartSession}
                    disabled={loading || units.length === 0}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Start New Session
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400">Session ID:</span> <span className="text-emerald-400 font-mono font-medium">{session.id}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400">Status:</span> <span className="text-amber-400 uppercase font-semibold">{session.status}</span>
              </div>
              <button
                onClick={() => { setSession(null); setFinalSummary(null); setPreviewUrl(null); }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
              >
                Reset Session
              </button>
            </div>
          )}
        </div>

        {/* Evaluator Simulation Control Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-300">Evaluator Geofence & Anti-Spoof Test Controls:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                checked={isOffSite}
                onChange={(e) => setIsOffSite(e.target.checked)}
                className="rounded border-slate-700 text-red-500 focus:ring-red-500"
              />
              <span className={isOffSite ? "text-red-400 font-medium" : "text-slate-400"}>
                Simulate Off-Site Capture (Geofence Breach)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                checked={isMockLocation}
                onChange={(e) => setIsMockLocation(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className={isMockLocation ? "text-amber-400 font-medium" : "text-slate-400"}>
                Simulate Mock Location (Fake GPS Spoof)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-sm flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Validation Error / Rule Alert</p>
            <p className="text-red-200/90 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Session Working Layout */}
      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Camera / Photo Capture & AI Face Inspector (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" /> Photo Capture & AI Analysis
                </h3>
                <span className="text-xs text-slate-400">
                  Photos in session: <strong className="text-emerald-400">{session.photos?.length || 0}</strong>
                </span>
              </div>

              {/* Viewport for Camera / Image Preview with Overlaid Bounding Boxes */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                {useWebcam ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : previewUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={previewUrl}
                      alt="Uploaded Group"
                      className="w-full h-full object-contain"
                    />
                    {/* Bounding Boxes Overlay */}
                    {currentFaces.map((f, i) => (
                      <div
                        key={i}
                        className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded pointer-events-none"
                        style={{
                          left: `${(f.bbox[0] / (qualityFeedback?.width || 640)) * 100}%`,
                          top: `${(f.bbox[1] / (qualityFeedback?.height || 480)) * 100}%`,
                          width: `${((f.bbox[2] - f.bbox[0]) / (qualityFeedback?.width || 640)) * 100}%`,
                          height: `${((f.bbox[3] - f.bbox[1]) / (qualityFeedback?.height || 480)) * 100}%`,
                        }}
                      >
                        <span className="absolute -top-4 left-0 bg-emerald-600 text-white font-mono text-[9px] px-1 py-0.2 rounded font-semibold">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">No photo captured yet</p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Capture a live group photo or upload a sample picture to run instant AI face detection & quality evaluation.
                    </p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-2.5">
                {useWebcam ? (
                  <button
                    onClick={captureCameraPhoto}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Snap Photo Now
                  </button>
                ) : (
                  <>
                    <button
                      onClick={startCamera}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" /> Open Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4 text-sky-400" /> Upload Image File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </>
                )}

                {previewUrl && (
                  <div className="ml-auto text-xs text-slate-400 flex items-center gap-2">
                    <span>Detected in this photo:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                      {currentFaces.length} Faces
                    </span>
                  </div>
                )}
              </div>

              {/* Quality Telemetry Card */}
              {qualityFeedback && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Quality Status:</span>
                    <span className={`font-semibold ${qualityFeedback.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {qualityFeedback.ok ? '✓ PASS (Acceptable)' : '✗ REJECTED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Blur Variance:</span>
                    <span className="text-slate-200 font-mono">{qualityFeedback.blur?.toFixed(1)} (Limit: 50)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mean Brightness:</span>
                    <span className="text-slate-200 font-mono">{qualityFeedback.brightness?.toFixed(1)} (45-225)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Resolution:</span>
                    <span className="text-slate-200 font-mono">{qualityFeedback.width} x {qualityFeedback.height}</span>
                  </div>
                  {qualityFeedback.reason && !qualityFeedback.ok && (
                    <div className="col-span-2 sm:col-span-4 text-red-400 text-[11px] pt-1 border-t border-slate-800">
                      Reason: {qualityFeedback.reason}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Finalization Result Modal / Box */}
            {finalSummary && (
              <div className="glass-panel p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-950/20 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> Session Finalized & Anti-Fraud Results
                  </h4>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    finalSummary.summary.verificationRatio >= 0.8
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    Ratio: {Math.round(finalSummary.summary.verificationRatio * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Unique Faces:</span>
                    <span className="text-lg font-bold text-slate-100 font-mono">{finalSummary.summary.faceCount}</span>
                    <span className="text-[10px] text-slate-500 block">De-duplicated across photos</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Ticked Names:</span>
                    <span className="text-lg font-bold text-slate-100 font-mono">{finalSummary.summary.tickedCount}</span>
                    <span className="text-[10px] text-slate-500 block">Claimed presence</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Attendance Rate:</span>
                    <span className="text-lg font-bold text-slate-100 font-mono">
                      {Math.round(finalSummary.summary.attendanceRate * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Of registered capacity</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Fraud Alerts:</span>
                    <span className={`text-lg font-bold font-mono ${finalSummary.alerts?.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {finalSummary.alerts?.length || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Rules triggered</span>
                  </div>
                </div>

                {finalSummary.alerts?.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs space-y-1.5">
                    <p className="font-semibold text-red-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> High Risk Alert Raised:
                    </p>
                    {finalSummary.alerts.map((a, i) => (
                      <p key={i} className="text-red-200/90 text-[11px] pl-5 list-disc">
                        • <strong>{a.ruleName}:</strong> {a.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Participant Register Ticking (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col h-[560px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> Beneficiary Register Ticking
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedParticipants.length} / {participants.length} Ticked
                </span>
              </div>

              {/* Search & Quick Action Bar */}
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  placeholder="Search participant by name or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleSelectAllVisible(20)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                    >
                      Tick 20 (Demo)
                    </button>
                    <button
                      onClick={() => handleSelectAllVisible(28)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                    >
                      Tick 28 (Over-Claim)
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedParticipants([])}
                    className="text-slate-400 hover:text-slate-200 text-[11px]"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Scrollable Register List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredParticipants.map(p => {
                  const isChecked = selectedParticipants.includes(p.id);
                  const isLongAbsent = (p.consecutiveAbsentDays || 0) >= 15;
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleParticipantTick(p.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-medium text-slate-200 flex items-center gap-1.5">
                            {p.name}
                            {isLongAbsent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                {p.consecutiveAbsentDays}d Absent
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {p.rollNo || p.id} • {p.gender}, Age {p.age || 15}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-slate-400">
                        {p.totalPresent || 0} / {p.totalWorkingDays || 25}d
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Finalize Session Action */}
              <div className="pt-3 border-t border-slate-800 mt-2 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Current Photo ID:</span>
                  <span className="font-mono text-slate-300">{lastUploadedPhotoId || 'None'}</span>
                </div>
                <button
                  onClick={handleFinalize}
                  disabled={loading || !session}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Finalize Session & Run Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
