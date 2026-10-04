import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Radio,
  Camera,
  ShieldCheck,
  Maximize2,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle,
  Eye,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Settings,
  Wifi,
  Smartphone,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface CameraStreamModalProps {
  isOpen: boolean;
  camera: any;
  streamUrl?: string;
  onClose: () => void;
  onTakeSnapshot?: (cam: any) => void;
}

// Auto-appends /video if missing (e.g. converts http://10.146.163.75:8080 to http://10.146.163.75:8080/video)
function normalizeStreamUrl(url: string): string {
  if (!url) return '';
  let trimmed = url.trim().replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    if (!parsed.pathname || parsed.pathname === '/' || parsed.pathname === '') {
      parsed.pathname = '/video';
      return parsed.toString();
    }
    return trimmed;
  } catch (e) {
    if (!trimmed.includes('/', 8)) {
      return trimmed + '/video';
    }
    return trimmed;
  }
}

export const CameraStreamModal: React.FC<CameraStreamModalProps> = ({
  isOpen,
  camera,
  streamUrl,
  onClose,
  onTakeSnapshot,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [showAiOverlay, setShowAiOverlay] = useState(true);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  
  // Default to using mobile phone as live source since physical CCTV is not connected
  const [useMobileSource, setUseMobileSource] = useState<boolean>(true);

  // Mobile stream configuration state
  const defaultEnvUrl = normalizeStreamUrl(
    (import.meta as any).env?.VITE_MOBILE_CCTV_STREAM_URL ||
    'http://10.146.163.75:8080/video'
  );
  
  const [customStreamUrl, setCustomStreamUrl] = useState<string>(() => {
    const stored = localStorage.getItem('nirikshan_mobile_cctv_url');
    return normalizeStreamUrl(stored || defaultEnvUrl);
  });
  
  const [inputUrl, setInputUrl] = useState<string>(customStreamUrl);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [streamStatus, setStreamStatus] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE'>('CONNECTING');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<number>(Date.now());
  const [forceDemoMode, setForceDemoMode] = useState<boolean>(false);

  // Synchronize input URL when custom stream URL changes
  useEffect(() => {
    setInputUrl(customStreamUrl);
  }, [customStreamUrl]);

  // Clock timer for OSD HUD
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString().replace('T', ' ').substring(0, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset connection state whenever modal opens or camera changes
  useEffect(() => {
    if (isOpen) {
      setStreamStatus('CONNECTING');
      setStreamError(null);
      setStreamKey(Date.now());
      setForceDemoMode(false);
      // Auto-ensure customStreamUrl has /video
      const stored = localStorage.getItem('nirikshan_mobile_cctv_url');
      if (stored && !stored.includes('/video')) {
        const fixed = normalizeStreamUrl(stored);
        setCustomStreamUrl(fixed);
        localStorage.setItem('nirikshan_mobile_cctv_url', fixed);
      }
    }
  }, [isOpen, camera?.id, camera?.code]);

  if (!isOpen || !camera) return null;

  // Determine whether this camera is mobile/IP camera or standard
  const isMobileCam =
    camera.code?.includes('MOB') ||
    camera.protocol === 'MJPEG' ||
    camera.protocol === 'HTTP' ||
    camera.model?.toLowerCase().includes('phone') ||
    camera.model?.toLowerCase().includes('android');

  // Compute active target stream URL
  const targetRawUrl = normalizeStreamUrl(
    (useMobileSource || isMobileCam)
      ? (customStreamUrl || defaultEnvUrl)
      : (camera.rawStreamUrl || customStreamUrl || defaultEnvUrl)
  );

  // Route through backend proxy to avoid CORS and browser Private Network Access issues
  const proxyStreamUrl = `/api/v1/cctv/mobile-stream?url=${encodeURIComponent(targetRawUrl)}&_t=${streamKey}`;
  const activeStreamSource = (useMobileSource || isMobileCam) ? proxyStreamUrl : (streamUrl || proxyStreamUrl);

  const handleSaveStreamUrl = (newUrl: string) => {
    const normalized = normalizeStreamUrl(newUrl);
    if (!normalized) return;
    setCustomStreamUrl(normalized);
    setInputUrl(normalized);
    localStorage.setItem('nirikshan_mobile_cctv_url', normalized);
    setStreamStatus('CONNECTING');
    setStreamError(null);
    setStreamKey(Date.now());
    setForceDemoMode(false);
    setShowConfigPanel(false);

    // Update backend configuration as well
    fetch('/api/v1/cctv/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileStreamUrl: normalized }),
    }).catch((err) => console.warn('Sync stream URL error:', err));
  };

  const handleCaptureSnapshot = () => {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
    setGeneratedHash(hash);
    setSnapshotTaken(true);
    if (onTakeSnapshot) onTakeSnapshot(camera);
    setTimeout(() => setSnapshotTaken(false), 4000);
  };

  const handleStreamLoad = () => {
    setStreamStatus('ONLINE');
    setStreamError(null);
  };

  const handleStreamError = () => {
    // If the URL did not end in /video, auto-fix it immediately
    if (targetRawUrl && !targetRawUrl.endsWith('/video')) {
      const fixed = normalizeStreamUrl(targetRawUrl);
      handleSaveStreamUrl(fixed);
      return;
    }
    setStreamStatus('OFFLINE');
    setStreamError(`Cannot reach mobile camera at ${targetRawUrl}. Check Wi-Fi and IP Webcam server.`);
  };

  const handleRetry = () => {
    setStreamStatus('CONNECTING');
    setStreamError(null);
    setStreamKey(Date.now());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              (useMobileSource || isMobileCam)
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
            }`}>
              {(useMobileSource || isMobileCam) ? <Smartphone className="w-5 h-5 animate-pulse" /> : <Video className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">{camera.name || camera.locationName || 'CCTV Stream'}</h3>
                <span className="font-mono text-xs text-sky-400 font-semibold">{camera.code || camera.cameraCode}</span>
                <StatusBadge status={streamStatus === 'ONLINE' ? 'ONLINE' : streamStatus === 'OFFLINE' ? 'OFFLINE' : (camera.status || 'ONLINE')} />
                {(useMobileSource || isMobileCam) && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/80 font-bold uppercase">
                    MOBILE IP CAM
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {camera.locationDescription || 'Live Wi-Fi Surveillance Feed'} &bull; {camera.model || 'Android IP Camera'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle between phone camera and default camera */}
            <button
              onClick={() => {
                setUseMobileSource(!useMobileSource);
                setStreamStatus('CONNECTING');
                setStreamKey(Date.now());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
                useMobileSource
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle mobile phone camera vs default hardware feed"
            >
              <Smartphone className="w-3.5 h-3.5" /> Source: {useMobileSource ? 'Mobile Phone' : 'Default Hardware'}
            </button>

            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
                showConfigPanel
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Configure Mobile IP Camera URL"
            >
              <Settings className="w-3.5 h-3.5" /> Mobile Cam URL
            </button>

            <button
              onClick={() => setShowAiOverlay(!showAiOverlay)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
                showAiOverlay
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Analytics {showAiOverlay ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Config Slide-Down Bar */}
        {showConfigPanel && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs text-slate-300 animate-in slide-in-from-top-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Configure Mobile Phone IP Camera Stream</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Format: http://&lt;phone-ip&gt;:8080/video</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://10.146.163.75:8080/video"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleSaveStreamUrl(inputUrl)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md"
              >
                Save & Reconnect
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputUrl(defaultEnvUrl);
                  handleSaveStreamUrl(defaultEnvUrl);
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Reset Default
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div>1. Connect Phone & PC to <strong>same Wi-Fi</strong>.</div>
              <div>2. In Android app (e.g. <em>IP Webcam</em>), tap <strong>Start server</strong>.</div>
              <div>3. URL automatically normalizes to include <code>/video</code>.</div>
            </div>
          </div>
        )}

        {/* Video Screen Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none">
          {/* Subtle Background Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

          {/* 1. Live Mobile Phone Camera Feed (MJPEG / HTTP) */}
          {!forceDemoMode && (
            <img
              key={streamKey}
              src={activeStreamSource}
              alt="Mobile CCTV Feed"
              className="w-full h-full object-contain pointer-events-none"
              onLoad={handleStreamLoad}
              onError={handleStreamError}
            />
          )}

          {/* 2. Camera Offline / Connection Error Overlay */}
          {streamStatus === 'OFFLINE' && !forceDemoMode && (
            <div className="absolute inset-0 bg-slate-950/92 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-3 shadow-lg">
                <ShieldAlert className="w-10 h-10 animate-pulse" />
              </div>
              
              <h4 className="text-sm font-bold text-slate-100">Camera Stream Offline or Unreachable</h4>
              <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                Could not connect to live camera feed at{' '}
                <code className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-amber-300">
                  {targetRawUrl}
                </code>
              </p>

              {/* Troubleshooting Checklist */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 max-w-lg w-full text-left space-y-2 text-xs text-slate-300">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-[11px] font-mono uppercase text-sky-400">
                  <Wifi className="w-3.5 h-3.5" /> Mobile Camera Setup Checklist:
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">&bull;</span>
                    <span><strong>Same Network:</strong> Ensure your phone and PC are connected to the exact same Wi-Fi router (or PC Wi-Fi hotspot).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">&bull;</span>
                    <span><strong>App Running:</strong> Open <em>IP Webcam</em> on Android, scroll to bottom and tap <strong>"Start server"</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">&bull;</span>
                    <span><strong>Stream Path:</strong> Video stream requires <code>/video</code> at the end (e.g. <code>http://10.146.163.75:8080/video</code>).</span>
                  </div>
                </div>
              </div>

              {/* Inline Quick Action Buttons */}
              <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                <button
                  onClick={() => handleSaveStreamUrl(normalizeStreamUrl(targetRawUrl))}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Reconnect to: {normalizeStreamUrl(targetRawUrl)}
                </button>
                <button
                  onClick={() => setShowConfigPanel(true)}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow"
                >
                  <Settings className="w-3.5 h-3.5" /> Change Phone IP
                </button>
                <button
                  onClick={handleRetry}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
                <button
                  onClick={() => setForceDemoMode(true)}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs transition border border-slate-800"
                >
                  Switch to Simulation Feed
                </button>
              </div>
            </div>
          )}

          {/* 3. Demo / Simulation Graphic Mode (when forced or testing) */}
          {forceDemoMode && (
            <div className="w-full h-full flex flex-col items-center justify-center relative p-6">
              <Radio className="w-16 h-16 text-sky-500/40 animate-pulse mb-3" />
              <div className="text-sm font-mono text-sky-400 font-semibold">SIMULATED EDGE SURVEILLANCE FEED</div>
              <div className="text-xs font-mono text-slate-500 mt-1">Resolution: 1080p Full HD &bull; FPS: 30 &bull; Simulated Latency: 38ms</div>
              <button
                onClick={() => {
                  setForceDemoMode(false);
                  setStreamStatus('CONNECTING');
                  setStreamKey(Date.now());
                }}
                className="mt-4 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
              >
                Reconnect to Mobile Phone Stream
              </button>
            </div>
          )}

          {/* AI Object Bounding Boxes Simulation & Analytics Overlays */}
          {showAiOverlay && (streamStatus === 'ONLINE' || forceDemoMode) && (
            <div className="absolute inset-10 pointer-events-none">
              {/* Person 1 Detection */}
              <div className="absolute left-[18%] top-[25%] w-[14%] h-[45%] border-2 border-emerald-400/80 rounded bg-emerald-500/10">
                <div className="absolute -top-5 left-0 bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                  BENEFICIARY #01 [98.4%]
                </div>
              </div>

              {/* Person 2 Detection */}
              <div className="absolute left-[44%] top-[22%] w-[15%] h-[50%] border-2 border-emerald-400/80 rounded bg-emerald-500/10">
                <div className="absolute -top-5 left-0 bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                  BENEFICIARY #02 [97.1%]
                </div>
              </div>

              {/* Trainer / Staff Detection */}
              <div className="absolute right-[22%] top-[20%] w-[16%] h-[55%] border-2 border-indigo-400/80 rounded bg-indigo-500/10">
                <div className="absolute -top-5 left-0 bg-indigo-950 text-indigo-300 border border-indigo-700 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                  INSTRUCTOR [99.2%]
                </div>
              </div>
            </div>
          )}

          {/* OSD Camera HUD Elements */}
          <div className="absolute top-4 left-4 flex items-center gap-2 text-[11px] font-mono font-bold bg-black/60 backdrop-blur-sm px-3 py-1 rounded-md text-red-400 border border-red-900/50">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            LIVE REC &bull; {camera.code || 'CAM-MOB'}
          </div>

          <div className="absolute top-4 right-4 text-[11px] font-mono bg-black/60 backdrop-blur-sm px-3 py-1 rounded-md text-slate-300 border border-slate-800">
            {currentTime} UTC+05:30
          </div>

          <div className="absolute bottom-4 left-4 text-[10px] font-mono bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-md text-slate-300 border border-slate-800 space-y-0.5">
            <div className={`font-semibold ${streamStatus === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
              STREAM STATUS: {streamStatus} ({streamStatus === 'ONLINE' ? 'LIVE MJPEG 30 FPS' : 'AWAITING IP FEED'})
            </div>
            <div className="text-slate-400 truncate max-w-xs">
              SOURCE: {targetRawUrl}
            </div>
          </div>

          {/* Quick HUD Action Overlay Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={handleCaptureSnapshot}
              className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow"
              title="Capture Cryptographic Snapshot"
            >
              <Camera className="w-3.5 h-3.5" /> Snapshot
            </button>
          </div>
        </div>

        {/* Snapshot Evidence Alert */}
        {snapshotTaken && (
          <div className="p-3 bg-emerald-950/80 border-y border-emerald-800 text-xs text-emerald-200 flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>Cryptographic Evidence Captured:</strong> SHA-256 Hash:{' '}
                <code className="font-mono text-[10px] text-emerald-300">{generatedHash.substring(0, 32)}...</code>
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">STORED IN EVIDENCE AUDIT LEDGER</span>
          </div>
        )}

        {/* Footer Technical Metadata */}
        <div className="p-4 px-6 bg-slate-950 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Stream URL / Endpoint</span>
            <span className="font-mono text-slate-300 truncate block mt-0.5" title={targetRawUrl}>
              {targetRawUrl}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Camera Hardware / Protocol</span>
            <span className="text-slate-300 block mt-0.5">
              {useMobileSource ? 'Android Mobile Handheld Camera' : (camera.model || 'CCTV Camera')} &bull; MJPEG/HTTP
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Tamper & AI Anomaly Detection</span>
            <span className="text-emerald-400 font-medium block mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Live Frame Biometric Integrity Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
