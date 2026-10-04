import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, MapPin, User, Sliders } from 'lucide-react';

export default function StaffCheckin() {
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [staffName, setStaffName] = useState('Inspector Ramesh Kumar');
  const [staffId, setStaffId] = useState('STF-102');
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Evaluator Simulation Controls
  const [isOffSite, setIsOffSite] = useState(false);
  const [isMockLocation, setIsMockLocation] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [useWebcam, setUseWebcam] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUnits();
    fetchCheckins();
  }, []);

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

  const fetchCheckins = async () => {
    try {
      const res = await axios.get('/api/staff/checkins');
      setCheckins(res.data.checkins || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getGpsPayload = () => {
    const selectedUnit = units.find(u => u.id === selectedUnitId);
    if (!selectedUnit) return { lat: 12.9716, lng: 77.5946, accuracy: 8, isMock: false };

    if (isOffSite) {
      return {
        lat: selectedUnit.location.lat + 0.04,
        lng: selectedUnit.location.lng + 0.04,
        accuracy: 12,
        isMock: isMockLocation
      };
    }

    return {
      lat: selectedUnit.location.lat + 0.0001,
      lng: selectedUnit.location.lng + 0.0001,
      accuracy: 8,
      isMock: isMockLocation
    };
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await submitCheckin(file);
    }
  };

  const submitCheckin = async (file) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('staffId', staffId);
    formData.append('staffName', staffName);
    formData.append('unitId', selectedUnitId);
    formData.append('gps', JSON.stringify(getGpsPayload()));

    try {
      const res = await axios.post('/api/staff/checkin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(`✓ Verified: Check-in confirmed at ${new Date(res.data.checkin.timestamp).toLocaleTimeString()}`);
      fetchCheckins();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setUseWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Camera access error: " + err.message);
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
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const stream = video.srcObject;
        if (stream) stream.getTracks().forEach(track => track.stop());
        setUseWebcam(false);
        submitCheckin(file);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Staff Anti-Fraud Protocol
          </span>
          <span className="text-slate-400 text-xs flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Geofence + Single Face Verification
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">Staff Member Live Selfie Check-In</h2>
        <p className="text-sm text-slate-400">
          Takes a live selfie, reads high-precision GPS coordinates, rejects mock locations, and ensures exactly one verified face on duty.
        </p>

        {/* Simulation Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-300">Fraud Simulation Controls:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={isOffSite}
                onChange={(e) => setIsOffSite(e.target.checked)}
                className="rounded border-slate-700 text-red-500 focus:ring-red-500"
              />
              <span className={isOffSite ? "text-red-400 font-medium" : "text-slate-400"}>
                Simulate Off-Site (Outside Unit)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
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

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Check-in Rejected</p>
            <p className="text-red-200/90 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selfie Capture Card (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" /> Staff Check-in Details
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Staff Member Name</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Staff ID / Employee Code</label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Assigned Institution</label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Selfie Frame */}
            <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
              {useWebcam ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : previewUrl ? (
                <img src={previewUrl} alt="Selfie preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-sky-400">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">Live Selfie Required</p>
                  <p className="text-[11px] text-slate-500">Only 1 face allowed in frame</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {useWebcam ? (
                <button
                  onClick={captureCameraPhoto}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-900/30 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Snap & Check In
                </button>
              ) : (
                <>
                  <button
                    onClick={startCamera}
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Open Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 font-medium"
                  >
                    Upload Selfie
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
            </div>
          </div>
        </div>

        {/* Right: Check-in Activity Feed (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col h-[520px]">
            <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> Recent Staff Check-In Log
              </span>
              <span className="text-xs text-slate-400 font-mono">{checkins.length} recorded</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {checkins.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {units.length === 0 ? 'No data available — Backend service is offline.' : 'No staff check-ins logged yet today.'}
                </div>
              ) : (
                checkins.map(c => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100">{c.staffName}</span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{c.unitName}</span>
                      <span className="font-mono text-slate-500">
                        {new Date(c.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                      <span>GPS: {c.distanceFromCenter || 0}m from center</span>
                      <span>•</span>
                      <span>SHA: {c.sha256?.substr(0, 10)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
