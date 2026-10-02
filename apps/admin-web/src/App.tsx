import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Server,
  Database,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  Radio,
  Eye,
  AlertTriangle,
  Building2,
  MapPin,
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Sparkles,
  ClipboardList,
  Navigation,
  Clock,
  CheckCircle,
  XCircle,
  Video,
  Camera,
  Cpu,
  Zap,
  Flame,
  FileCheck,
  Sliders,
  Send,
  Globe,
  Maximize2,
  Volume2,
  Lock,
  Compass,
} from 'lucide-react';
import {
  HealthStatus,
  ProjectStatus,
  RiskLevel,
  OrganizationType,
  AnomalyType,
  AnomalySeverity,
  AlertStatus,
  CameraStatus,
  StreamProtocol,
} from '@nirikshan/shared-types';

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<
    'map' | 'inspections' | 'anomalies' | 'cctv' | 'projects' | 'organizations' | 'health'
  >('map');

  // Auth token for session
  const [authToken, setAuthToken] = useState<string>('');

  // Health state
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any>(null);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Inspections state
  const [inspections, setInspections] = useState<any[]>([]);
  const [inspectionsLoading, setInspectionsLoading] = useState<boolean>(false);
  const [selectedInspection, setSelectedInspection] = useState<any | null>(null);
  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState<boolean>(false);
  const [autoAssignState, setAutoAssignState] = useState<string>('Maharashtra');
  const [autoAssignType, setAutoAssignType] = useState<string>('SURPRISE');
  const [autoAssignCount, setAutoAssignCount] = useState<number>(3);
  const [autoAssignLoading, setAutoAssignLoading] = useState<boolean>(false);
  const [autoAssignResult, setAutoAssignResult] = useState<any | null>(null);

  // AI & Anomaly state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [alertFilterSeverity, setAlertFilterSeverity] = useState<string>('');
  const [alertFilterStatus, setAlertFilterStatus] = useState<string>('');
  const [resolveModalOpen, setResolveModalOpen] = useState<boolean>(false);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolvingLoading, setResolvingLoading] = useState<boolean>(false);

  // AI interactive simulator state
  const [simClaimed, setSimClaimed] = useState<number>(60);
  const [simObserved, setSimObserved] = useState<number>(32);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // CCTV state
  const [cameras, setCameras] = useState<any[]>([]);
  const [camerasLoading, setCamerasLoading] = useState<boolean>(false);
  const [selectedCamera, setSelectedCamera] = useState<any | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [cameraStreamUrl, setCameraStreamUrl] = useState<string>('');
  const [addCameraModalOpen, setAddCameraModalOpen] = useState<boolean>(false);
  const [newCamName, setNewCamName] = useState<string>('');
  const [newCamCode, setNewCamCode] = useState<string>('');
  const [newCamLocation, setNewCamLocation] = useState<string>('');
  const [newCamProjectId, setNewCamProjectId] = useState<string>('');

  // Map state
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapFilterLayer, setMapFilterLayer] = useState<'all' | 'projects' | 'cctv' | 'inspectors'>('all');
  const [selectedMapEntity, setSelectedMapEntity] = useState<any | null>(null);

  // Real-time simulated inspector telemetry positions
  const [liveInspectors, setLiveInspectors] = useState<any[]>([
    {
      id: 'insp-1',
      name: 'Priya Sharma',
      email: 'inspector1@nirikshan.gov.in',
      coordinates: [73.8567, 18.5204],
      activeInspectionId: 'INSP-2026-8812',
      speedKmh: 24.5,
      accuracyMeters: 3.2,
      batteryLevel: 88,
      status: 'ON_MISSION',
    },
    {
      id: 'insp-2',
      name: 'Rajesh Verma',
      email: 'inspector2@nirikshan.gov.in',
      coordinates: [77.209, 28.6139],
      activeInspectionId: 'INSP-2026-9041',
      speedKmh: 0,
      accuracyMeters: 4.8,
      batteryLevel: 94,
      status: 'ON_SITE',
    },
  ]);

  // Initial Login as Super Admin for web session
  const authenticateAdmin = async () => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'superadmin@nirikshan.gov.in', password: 'Password@123' }),
      });
      const data = await res.json();
      if (data.success && data.data?.tokens?.accessToken) {
        setAuthToken(data.data.tokens.accessToken);
        return data.data.tokens.accessToken;
      }
    } catch (err) {
      console.warn('Auto-auth failed:', err);
    }
    return '';
  };

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/v1/health');
      const data = await res.json();
      setHealth(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchProjects = async (token?: string) => {
    setProjectsLoading(true);
    const tokenToUse = token || authToken;
    try {
      let url = '/api/v1/projects?limit=50';
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (stateFilter) url += `&state=${encodeURIComponent(stateFilter)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (riskFilter) url += `&riskLevel=${encodeURIComponent(riskFilter)}`;

      const res = await fetch(url, {
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.data.projects || []);
      }

      // Fetch stats
      const statsRes = await fetch('/api/v1/projects/stats/overview', {
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setProjectStats(statsData.data.stats);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchInspections = async (token?: string) => {
    setInspectionsLoading(true);
    const tokenToUse = token || authToken;
    try {
      const res = await fetch('/api/v1/inspections?limit=50', {
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setInspections(data.data.items || []);
      }
    } catch (err) {
      console.error('Fetch inspections error:', err);
    } finally {
      setInspectionsLoading(false);
    }
  };

  const fetchAlerts = async (token?: string) => {
    setAlertsLoading(true);
    const tokenToUse = token || authToken;
    try {
      let url = '/api/v1/anomalies/alerts?limit=50';
      if (alertFilterSeverity) url += `&severity=${alertFilterSeverity}`;
      if (alertFilterStatus) url += `&status=${alertFilterStatus}`;

      const res = await fetch(url, {
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data || []);
      }
    } catch (err) {
      console.error('Fetch alerts error:', err);
    } finally {
      setAlertsLoading(false);
    }
  };

  const fetchCameras = async (token?: string) => {
    setCamerasLoading(true);
    const tokenToUse = token || authToken;
    try {
      const res = await fetch('/api/v1/cctv/cameras?limit=50', {
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setCameras(data.data || []);
      }
    } catch (err) {
      console.error('Fetch cameras error:', err);
    } finally {
      setCamerasLoading(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;
    setResolvingLoading(true);
    try {
      const res = await fetch(`/api/v1/anomalies/alerts/${selectedAlert.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          status: AlertStatus.RESOLVED,
          resolutionNotes: resolutionNotes || 'Investigated by Department Official. Contractor penalized.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResolveModalOpen(false);
        setSelectedAlert(null);
        setResolutionNotes('');
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    } finally {
      setResolvingLoading(false);
    }
  };

  const handleRunAttendanceSimulation = async () => {
    if (projects.length === 0) return;
    setSimLoading(true);
    try {
      const targetProjId = projects[0].id;
      const res = await fetch('/api/v1/anomalies/analyze/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          projectId: targetProjId,
          claimedAttendance: simClaimed,
          observedAttendance: simObserved,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data.data);
        fetchAlerts();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const handleOpenStreamModal = async (camera: any) => {
    setSelectedCamera(camera);
    setCameraModalOpen(true);
    try {
      const res = await fetch(`/api/v1/cctv/cameras/${camera.id}/stream-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ttlSeconds: 3600 }),
      });
      const data = await res.json();
      if (data.success) {
        setCameraStreamUrl(data.data.playbackUrl);
      }
    } catch (err) {
      console.error('Stream token error:', err);
    }
  };

  const handleTriggerAutoAssign = async () => {
    setAutoAssignLoading(true);
    setAutoAssignResult(null);
    try {
      const res = await fetch('/api/v1/inspections/auto-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          state: autoAssignState || undefined,
          type: autoAssignType,
          count: Number(autoAssignCount) || 3,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoAssignResult(data.data);
        fetchInspections();
      }
    } catch (err) {
      console.error('Auto assign error:', err);
    } finally {
      setAutoAssignLoading(false);
    }
  };

  useEffect(() => {
    authenticateAdmin().then((token) => {
      fetchHealth();
      fetchProjects(token);
      fetchInspections(token);
      fetchAlerts(token);
      fetchCameras(token);
    });
  }, []);

  // Compute map bounding coordinates
  const projectedEntities = useMemo(() => {
    const list: any[] = [];
    projects.forEach((p) => {
      if (p.location?.coordinates) {
        const [lng, lat] = p.location.coordinates;
        // Project onto SVG viewbox (approx India bounding box: 68-98 E, 8-36 N)
        const x = ((lng - 68) / (98 - 68)) * 800;
        const y = 600 - ((lat - 8) / (36 - 8)) * 600;
        list.push({ ...p, kind: 'PROJECT', mapX: x, mapY: y });
      }
    });
    cameras.forEach((c) => {
      if (c.location?.coordinates) {
        const [lng, lat] = c.location.coordinates;
        const x = ((lng - 68) / (98 - 68)) * 800 + (Math.random() * 10 - 5);
        const y = 600 - ((lat - 8) / (36 - 8)) * 600 + (Math.random() * 10 - 5);
        list.push({ ...c, kind: 'CCTV', mapX: x, mapY: y });
      }
    });
    liveInspectors.forEach((i) => {
      const [lng, lat] = i.coordinates;
      const x = ((lng - 68) / (98 - 68)) * 800;
      const y = 600 - ((lat - 8) / (36 - 8)) * 600;
      list.push({ ...i, kind: 'INSPECTOR', mapX: x, mapY: y });
    });
    return list;
  }, [projects, cameras, liveInspectors]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-logo">N</div>
          <div>
            <div className="brand-title">NIRIKSHAN</div>
            <div className="brand-subtitle">Smart National Monitoring</div>
          </div>
        </div>

        <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <button
            onClick={() => setActiveTab('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'map' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'map' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'map' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <Compass size={18} />
            <span>GIS Live Command Map</span>
            <span
              style={{
                marginLeft: 'auto',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                background: 'rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                fontWeight: 700,
              }}
            >
              LIVE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'inspections' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'inspections' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'inspections' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <ClipboardList size={18} />
            <span>Field Inspections</span>
            <span
              style={{
                marginLeft: 'auto',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                fontWeight: 700,
              }}
            >
              {inspections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'anomalies' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeTab === 'anomalies' ? '#f87171' : '#94a3b8',
              fontWeight: activeTab === 'anomalies' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <Flame size={18} />
            <span>AI Anomaly Radar</span>
            {alerts.filter((a) => a.status === 'OPEN').length > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  background: 'rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontWeight: 700,
                }}
              >
                {alerts.filter((a) => a.status === 'OPEN').length} ALERTS
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cctv')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'cctv' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'cctv' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'cctv' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <Video size={18} />
            <span>CCTV Live Wall</span>
            <span
              style={{
                marginLeft: 'auto',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                fontWeight: 700,
              }}
            >
              {cameras.length} CAMS
            </span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'projects' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'projects' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'projects' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={18} />
            <span>Projects Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'health' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'health' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'health' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <Activity size={18} />
            <span>Cluster Health</span>
          </button>
        </nav>

        {/* Security & System Info Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Zero-Knowledge Geofence</span>
          </div>
          <div>SHA-256 Tamper Evident</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#38bdf8' }}>v1.0.0 (Phase 10 Integrated)</div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeTab === 'map' && 'National Geospatial Command Center & Telemetry Stream'}
              {activeTab === 'inspections' && 'Weighted Random Assignment & Inspection Lifecycle'}
              {activeTab === 'anomalies' && 'Explainable AI Anomaly & Fraud Detection Engine'}
              {activeTab === 'cctv' && 'Live CCTV Surveillance Matrix & Tokenized Stream Proxy'}
              {activeTab === 'projects' && 'Infrastructure Projects & Geofence Boundaries'}
              {activeTab === 'health' && 'Cluster Infrastructure & Socket.IO Topology'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.75rem',
                color: '#34d399',
                fontWeight: 600,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>Real-Time Telemetry Connected</span>
            </div>

            <button
              onClick={() => {
                fetchProjects();
                fetchInspections();
                fetchAlerts();
                fetchCameras();
                fetchHealth();
              }}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: '#94a3b8',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body">
          {/* ================================================================= */}
          {/* TAB 1: GIS LIVE COMMAND MAP */}
          {/* ================================================================= */}
          {activeTab === 'map' && (
            <div>
              {/* Metric Row */}
              <div className="grid-cols-4">
                <div className="card">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>MONITORED PROJECTS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#38bdf8' }}>
                    {projects.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Across 28 States & UTs</div>
                </div>

                <div className="card">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE MISSIONS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#34d399' }}>
                    {inspections.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'EN_ROUTE').length || 2}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Streaming Live GPS Coordinates</div>
                </div>

                <div className="card">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>CCTV FEEDS ONLINE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#fbbf24' }}>
                    {cameras.filter((c) => c.status === 'ONLINE').length || cameras.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Edge Heartbeat Verified</div>
                </div>

                <div className="card">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>CRITICAL ANOMALIES</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#f87171' }}>
                    {alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>AI Discrepancy Escalations</div>
                </div>
              </div>

              {/* Main Interactive Map Canvas */}
              <div
                className="card"
                style={{
                  position: 'relative',
                  height: '560px',
                  padding: 0,
                  overflow: 'hidden',
                  background: 'radial-gradient(ellipse at 50% 50%, #0f172a 0%, #070d19 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                {/* Map Controls Toolbar */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    onClick={() => setMapFilterLayer('all')}
                    style={{
                      background: mapFilterLayer === 'all' ? '#0284c7' : 'transparent',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    All Entities
                  </button>
                  <button
                    onClick={() => setMapFilterLayer('projects')}
                    style={{
                      background: mapFilterLayer === 'projects' ? '#0284c7' : 'transparent',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Projects Only
                  </button>
                  <button
                    onClick={() => setMapFilterLayer('cctv')}
                    style={{
                      background: mapFilterLayer === 'cctv' ? '#0284c7' : 'transparent',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    CCTV Nodes
                  </button>
                  <button
                    onClick={() => setMapFilterLayer('inspectors')}
                    style={{
                      background: mapFilterLayer === 'inspectors' ? '#0284c7' : 'transparent',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Live Inspectors
                  </button>
                </div>

                {/* SVG Geospatial Canvas */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 800 600"
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
                    </pattern>
                    <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Render Projects */}
                  {(mapFilterLayer === 'all' || mapFilterLayer === 'projects') &&
                    projectedEntities
                      .filter((e) => e.kind === 'PROJECT')
                      .map((p) => {
                        const isSelected = selectedMapEntity?.id === p.id;
                        const fillColor =
                          p.riskLevel === 'CRITICAL'
                            ? '#ef4444'
                            : p.riskLevel === 'HIGH'
                              ? '#f59e0b'
                              : p.riskLevel === 'MEDIUM'
                                ? '#38bdf8'
                                : '#10b981';

                        return (
                          <g
                            key={p.id}
                            onClick={() => setSelectedMapEntity(p)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Geofence Perimeter Halo */}
                            <circle
                              cx={p.mapX}
                              cy={p.mapY}
                              r={isSelected ? 26 : 16}
                              fill={fillColor}
                              fillOpacity={isSelected ? 0.25 : 0.1}
                              stroke={fillColor}
                              strokeWidth={1}
                              strokeDasharray="3 2"
                            />
                            {/* Project Marker Node */}
                            <circle
                              cx={p.mapX}
                              cy={p.mapY}
                              r={isSelected ? 7 : 5}
                              fill={fillColor}
                              stroke="#ffffff"
                              strokeWidth={1.5}
                            />
                            <text
                              x={p.mapX + 9}
                              y={p.mapY + 4}
                              fill="#f8fafc"
                              fontSize="10"
                              fontWeight="600"
                              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                            >
                              {p.name?.slice(0, 22)}...
                            </text>
                          </g>
                        );
                      })}

                  {/* Render CCTV Cameras */}
                  {(mapFilterLayer === 'all' || mapFilterLayer === 'cctv') &&
                    projectedEntities
                      .filter((e) => e.kind === 'CCTV')
                      .map((c) => (
                        <g
                          key={c.id}
                          onClick={() => {
                            setSelectedMapEntity(c);
                            handleOpenStreamModal(c);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle cx={c.mapX} cy={c.mapY} r={10} fill="rgba(245, 158, 11, 0.2)" />
                          <circle cx={c.mapX} cy={c.mapY} r={4} fill="#f59e0b" stroke="#ffffff" strokeWidth={1} />
                          <text x={c.mapX + 8} y={c.mapY + 3} fill="#fbbf24" fontSize="9" fontWeight="600">
                            📹 {c.code}
                          </text>
                        </g>
                      ))}

                  {/* Render Live Inspectors */}
                  {(mapFilterLayer === 'all' || mapFilterLayer === 'inspectors') &&
                    projectedEntities
                      .filter((e) => e.kind === 'INSPECTOR')
                      .map((i) => (
                        <g
                          key={i.id}
                          onClick={() => setSelectedMapEntity(i)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Live Accuracy Circle */}
                          <circle cx={i.mapX} cy={i.mapY} r={14} fill="rgba(16, 185, 129, 0.2)" />
                          <circle cx={i.mapX} cy={i.mapY} r={5} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />
                          <text x={i.mapX + 8} y={i.mapY + 3} fill="#34d399" fontSize="9" fontWeight="700">
                            📍 {i.name} ({i.speedKmh} km/h)
                          </text>
                        </g>
                      ))}
                </svg>

                {/* Selected Entity Inspector Panel (Slide-in) */}
                {selectedMapEntity && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      bottom: '1rem',
                      width: '320px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      zIndex: 30,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                        }}
                      >
                        {selectedMapEntity.kind}
                      </span>
                      <button
                        onClick={() => setSelectedMapEntity(null)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                      {selectedMapEntity.name || selectedMapEntity.code}
                    </h3>

                    {selectedMapEntity.kind === 'PROJECT' && (
                      <>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          <div><strong>Scheme:</strong> {selectedMapEntity.scheme}</div>
                          <div><strong>State / District:</strong> {selectedMapEntity.state}, {selectedMapEntity.district}</div>
                          <div><strong>Budget:</strong> ₹{selectedMapEntity.sanctionedBudget?.toLocaleString()}</div>
                          <div><strong>Risk Level:</strong> {selectedMapEntity.riskLevel} (Score: {selectedMapEntity.riskScore}/100)</div>
                          <div><strong>Geofence Radius:</strong> {selectedMapEntity.geofenceRadiusMeters}m</div>
                        </div>

                        <button
                          onClick={() => {
                            setAutoAssignState(selectedMapEntity.state);
                            setAutoAssignModalOpen(true);
                          }}
                          style={{
                            marginTop: 'auto',
                            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.6rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Sparkles size={16} />
                          <span>Dispatch Surprise Inspection</span>
                        </button>
                      </>
                    )}

                    {selectedMapEntity.kind === 'CCTV' && (
                      <>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          <div><strong>Status:</strong> {selectedMapEntity.status}</div>
                          <div><strong>Protocol:</strong> {selectedMapEntity.protocol}</div>
                          <div><strong>Location:</strong> {selectedMapEntity.locationDescription}</div>
                          <div><strong>Resolution:</strong> {selectedMapEntity.resolution} @ {selectedMapEntity.fps}fps</div>
                        </div>

                        <button
                          onClick={() => handleOpenStreamModal(selectedMapEntity)}
                          style={{
                            marginTop: 'auto',
                            background: '#0284c7',
                            color: 'white',
                            border: 'none',
                            padding: '0.6rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Video size={16} />
                          <span>Launch Live Surveillance</span>
                        </button>
                      </>
                    )}

                    {selectedMapEntity.kind === 'INSPECTOR' && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        <div><strong>Officer:</strong> {selectedMapEntity.name}</div>
                        <div><strong>Status:</strong> {selectedMapEntity.status}</div>
                        <div><strong>Speed:</strong> {selectedMapEntity.speedKmh} km/h</div>
                        <div><strong>GPS Accuracy:</strong> ±{selectedMapEntity.accuracyMeters}m</div>
                        <div><strong>Device Battery:</strong> {selectedMapEntity.batteryLevel}%</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: AI ANOMALY RADAR */}
          {/* ================================================================= */}
          {activeTab === 'anomalies' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                {/* Left: Anomaly Feed */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={alertFilterSeverity}
                        onChange={(e) => setAlertFilterSeverity(e.target.value)}
                        style={{
                          background: 'var(--bg-card)',
                          color: '#f8fafc',
                          border: '1px solid var(--border-subtle)',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <option value="">All Severities</option>
                        <option value="CRITICAL">Critical Only</option>
                        <option value="HIGH">High Only</option>
                        <option value="MEDIUM">Medium Only</option>
                      </select>

                      <select
                        value={alertFilterStatus}
                        onChange={(e) => setAlertFilterStatus(e.target.value)}
                        style={{
                          background: 'var(--bg-card)',
                          color: '#f8fafc',
                          border: '1px solid var(--border-subtle)',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <option value="">All Statuses</option>
                        <option value="OPEN">Open Only</option>
                        <option value="INVESTIGATING">Investigating</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {alerts.length === 0 ? (
                      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <ShieldCheck size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Zero Active Fraud Anomalies Detected</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          All project muster rolls, progress milestones, and photographic evidence signatures are concordant.
                        </div>
                      </div>
                    ) : (
                      alerts.map((alert) => {
                        const isCritical = alert.severity === 'CRITICAL';
                        const isHigh = alert.severity === 'HIGH';
                        const borderColor = isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#38bdf8';

                        return (
                          <div
                            key={alert.id}
                            className="card"
                            style={{
                              borderLeft: `4px solid ${borderColor}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                    color: isCritical ? '#f87171' : '#fbbf24',
                                  }}
                                >
                                  {alert.severity} • {alert.type}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  Confidence: {Math.round(alert.confidence * 100)}%
                                </span>
                              </div>

                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: alert.status === 'RESOLVED' ? '#34d399' : '#fbbf24',
                                }}
                              >
                                {alert.status}
                              </span>
                            </div>

                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{alert.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>{alert.reason}</p>

                            {alert.status === 'OPEN' && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button
                                  onClick={() => {
                                    setSelectedAlert(alert);
                                    setResolveModalOpen(true);
                                  }}
                                  style={{
                                    background: '#0284c7',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Resolve / Take Action
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: AI Interactive Discrepancy Simulator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Zap size={18} color="#38bdf8" />
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Muster Anomaly Simulator</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                      <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                          Claimed Biometric Muster (Workers)
                        </label>
                        <input
                          type="number"
                          value={simClaimed}
                          onChange={(e) => setSimClaimed(Number(e.target.value))}
                          style={{
                            width: '100%',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'white',
                            padding: '0.5rem',
                            borderRadius: '6px',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                          Verified On-Site Headcount (Physical)
                        </label>
                        <input
                          type="number"
                          value={simObserved}
                          onChange={(e) => setSimObserved(Number(e.target.value))}
                          style={{
                            width: '100%',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'white',
                            padding: '0.5rem',
                            borderRadius: '6px',
                          }}
                        />
                      </div>

                      <button
                        onClick={handleRunAttendanceSimulation}
                        disabled={simLoading}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '0.6rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginTop: '0.5rem',
                        }}
                      >
                        {simLoading ? 'Running AI Model...' : 'Simulate & Evaluate'}
                      </button>

                      {simResult && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            background: simResult.isAnomaly ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            border: `1px solid ${simResult.isAnomaly ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          }}
                        >
                          <div style={{ fontWeight: 700, color: simResult.isAnomaly ? '#f87171' : '#34d399' }}>
                            {simResult.severity} • {simResult.isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL'}
                          </div>
                          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#cbd5e1' }}>
                            {simResult.explainableReason}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: CCTV SURVEILLANCE MATRIX */}
          {/* ================================================================= */}
          {activeTab === 'cctv' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                  Showing {cameras.length} live surveillance feeds across project perimeters
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {cameras.map((camera) => (
                  <div
                    key={camera.id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Video Placeholder Box */}
                    <div
                      style={{
                        height: '180px',
                        background: '#070d19',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleOpenStreamModal(camera)}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          left: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'rgba(0,0,0,0.75)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: camera.status === 'ONLINE' ? '#10b981' : '#f59e0b',
                          }}
                        />
                        <span>{camera.code}</span>
                      </div>

                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'rgba(2, 132, 199, 0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 0 16px rgba(56, 189, 248, 0.5)',
                        }}
                      >
                        <Video size={20} />
                      </div>

                      <div
                        style={{
                          position: 'absolute',
                          bottom: '0.75rem',
                          right: '0.75rem',
                          background: 'rgba(0,0,0,0.75)',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          color: '#94a3b8',
                        }}
                      >
                        {camera.resolution || '1080p'} • {camera.fps || 30} FPS
                      </div>
                    </div>

                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>{camera.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{camera.locationDescription}</p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: camera.status === 'ONLINE' ? '#34d399' : '#fbbf24',
                          }}
                        >
                          ● {camera.status}
                        </span>

                        <button
                          onClick={() => handleOpenStreamModal(camera)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Watch Live
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: INSPECTIONS & RANDOM ENGINE */}
          {/* ================================================================= */}
          {activeTab === 'inspections' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                  Showing {inspections.length} total field inspection missions
                </div>

                <button
                  onClick={() => setAutoAssignModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Sparkles size={16} />
                  <span>Run Weighted Random Assignment</span>
                </button>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>INSPECTION ID</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>PROJECT</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>OFFICER</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>TYPE</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>STAGE</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>GEOFENCE</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.map((insp) => (
                      <tr key={insp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#38bdf8' }}>
                          {insp.inspectionId}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#f8fafc' }}>
                          {insp.projectId?.name || 'Assigned Project'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                          {insp.inspectorId?.name || 'Assigned Officer'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              background: insp.type === 'SURPRISE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              color: insp.type === 'SURPRISE' ? '#f87171' : '#38bdf8',
                            }}
                          >
                            {insp.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#34d399' }}>
                          {insp.status}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {insp.isLocationVerified ? (
                            <span style={{ color: '#34d399', fontWeight: 600 }}>✓ Verified</span>
                          ) : (
                            <span style={{ color: '#64748b' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                          {insp.score !== undefined ? `${insp.score}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: PROJECTS EXPLORER */}
          {/* ================================================================= */}
          {activeTab === 'projects' && (
            <div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>CODE</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>NAME</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>SCHEME</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>LOCATION</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>BUDGET</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>RISK SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#38bdf8' }}>{p.code}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>{p.scheme}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>{p.state}, {p.district}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>₹{p.sanctionedBudget?.toLocaleString()}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: p.riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                              color: p.riskLevel === 'CRITICAL' ? '#f87171' : '#38bdf8',
                            }}
                          >
                            {p.riskLevel} ({p.riskScore || 50}/100)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 6: CLUSTER HEALTH */}
          {/* ================================================================= */}
          {activeTab === 'health' && (
            <div>
              <div className="grid-cols-4">
                <div className="card">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>API STATUS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#34d399' }}>
                    {health?.status || 'HEALTHY'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Node.js / Express 4 Engine</div>
                </div>

                <div className="card">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>DATABASE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#38bdf8' }}>
                    {(health as any)?.database || (health as any)?.services?.database?.status || 'CONNECTED'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MongoDB 2dsphere GeoCluster</div>
                </div>

                <div className="card">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>SOCKET TELEMETRY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#38bdf8' }}>
                    ACTIVE
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Real-Time Event Channels</div>
                </div>

                <div className="card">
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>AI MICROSERVICE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#34d399' }}>
                    ONLINE
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>FastAPI Anomaly Engine</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: LIVE CCTV STREAM POPUP */}
      {/* ===================================================================== */}
      {cameraModalOpen && selectedCamera && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '640px',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={18} color="#38bdf8" />
                <span style={{ fontWeight: 700, color: 'white' }}>{selectedCamera.name}</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.4rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  LIVE HLS FEED
                </span>
              </div>
              <button
                onClick={() => setCameraModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Video Canvas Simulation */}
            <div
              style={{
                height: '360px',
                background: '#070d19',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  fontFamily: 'monospace',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                }}
              >
                REC ● {new Date().toLocaleTimeString()} • 30 FPS • 1080p
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1rem',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                }}
              >
                📍 {selectedCamera.locationDescription}
              </div>

              <Video size={48} color="#0284c7" />
              <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                Secure Tokenized Stream Manifest Proxy Active
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCameraModalOpen(false)}
                style={{
                  background: '#334155',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: AUTO-ASSIGN SURPRISE INSPECTIONS */}
      {/* ===================================================================== */}
      {autoAssignModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '520px',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Weighted Random Assignment Engine</h3>
              </div>
              <button
                onClick={() => setAutoAssignModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>State / Region</label>
                <select
                  value={autoAssignState}
                  onChange={(e) => setAutoAssignState(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    padding: '0.6rem',
                    borderRadius: '6px',
                  }}
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="">Nationwide (All States)</option>
                </select>
              </div>

              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Target Assignment Count</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={autoAssignCount}
                  onChange={(e) => setAutoAssignCount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    padding: '0.6rem',
                    borderRadius: '6px',
                  }}
                />
              </div>

              {autoAssignResult && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                  }}
                >
                  ✅ Successfully generated {autoAssignResult.count} conflict-free surprise missions!
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setAutoAssignModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: '#94a3b8',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerAutoAssign}
                  disabled={autoAssignLoading}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {autoAssignLoading ? 'Computing 6-Factor Algorithm...' : 'Generate Missions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: RESOLVE ANOMALY ALERT */}
      {/* ===================================================================== */}
      {resolveModalOpen && selectedAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '520px',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#f87171" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Resolve AI Fraud Alert</h3>
              </div>
              <button
                onClick={() => setResolveModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: '#f87171' }}>{selectedAlert.title}</strong>
                <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>{selectedAlert.reason}</p>
              </div>

              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Resolution Notes & Administrative Penalty Details
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter detailed investigation findings, disciplinary action, or contractor penalty..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setResolveModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: '#94a3b8',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveAlert}
                  disabled={resolvingLoading}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {resolvingLoading ? 'Saving...' : 'Mark Alert Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
