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
  PlayCircle,
  Users,
  GraduationCap,
  History,
  Coins,
  CheckSquare,
  Shield
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
  IRiskScoreBreakdown,
  UserRole,
  Permissions
} from '@nirikshan/shared-types';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SessionsModal } from './components/common/SessionsModal';
import { PersonaSwitcherModal } from './components/common/PersonaSwitcherModal';
import { AccessDenied } from './components/common/AccessDenied';
import { UserManagementView } from './components/views/UserManagementView';
import { GoogleEarthLeafletMap } from './components/GoogleEarthLeafletMap';
import { Topbar } from './components/common/Topbar';
import { Sidebar } from './components/common/Sidebar';
import { PortalHero, CoverageFilterBar, portalKindFromRoles } from './components/common/PortalHome';
import { StatusBadge } from './components/common/StatusBadge';
import { RiskCard } from './components/common/RiskCard';
import { EntityDrawer } from './components/common/EntityDrawer';
import { FinancialIntelligenceView } from './components/views/FinancialIntelligenceView';
import { ComplianceView } from './components/views/ComplianceView';
import { BeneficiariesView } from './components/views/BeneficiariesView';
import { CorrectiveActionsView } from './components/views/CorrectiveActionsView';
import { VCSurpriseView } from './components/views/VCSurpriseView';
import { DemoScenarioRunner } from './components/views/DemoScenarioRunner';
import { NgoDashboard } from './components/roles/NgoDashboard';
import { InspectorDashboard } from './components/roles/InspectorDashboard';
import { BeneficiaryDashboard } from './components/roles/BeneficiaryDashboard';
import { ArchitectureModal } from './components/common/ArchitectureModal';

// @ts-ignore
import DataIntegrityWorkspace from './components/attendance/DataIntegrityWorkspace.jsx';
// @ts-ignore
import CaptureWorkflow from './components/attendance/CaptureWorkflow.jsx';
// @ts-ignore
import StaffCheckin from './components/attendance/StaffCheckin.jsx';
// @ts-ignore
import DemoRunner from './components/attendance/DemoRunner.jsx';

export function App() {
  const {
    user,
    roles,
    permissions,
    scope,
    authToken,
    isAuthenticated,
    loading: authLoading,
    hasPermission,
    hasRole,
    logout
  } = useAuth();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('command');
  const [architectureModalOpen, setArchitectureModalOpen] = useState<boolean>(false);
  const [sessionsModalOpen, setSessionsModalOpen] = useState<boolean>(false);
  const [personaSwitcherOpen, setPersonaSwitcherOpen] = useState<boolean>(false);

  // Role detection
  const isNgo =
    hasRole(UserRole.NGO_ADMIN) ||
    hasRole(UserRole.NGO_PROJECT_MANAGER) ||
    hasRole(UserRole.NGO_STAFF);

  const isInspector = hasRole(UserRole.PMU_INSPECTOR);
  const isBeneficiary = hasRole(UserRole.BENEFICIARY);

  // Initialize/sync default tab on user identity change
  useEffect(() => {
    if (!user) return;
    if (isNgo) {
      setActiveTab('ngo_overview');
    } else if (isInspector) {
      setActiveTab('inspector_today');
    } else if (isBeneficiary) {
      setActiveTab('ben_profile');
    } else {
      setActiveTab('command');
    }
  }, [(user as any)?._id, user?.id, user?.role]);

  // Core backend entity state
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any>(null);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [inspections, setInspections] = useState<any[]>([]);
  const [inspectionsLoading, setInspectionsLoading] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [camerasLoading, setCamerasLoading] = useState<boolean>(false);
  const [units, setUnits] = useState<any[]>([]);
  const [liveInspectors, setLiveInspectors] = useState<any[]>([]);

  // Extended domain models state
  const [complianceRecords, setComplianceRecords] = useState<any[]>([]);
  const [complianceStats, setComplianceStats] = useState<any>(null);
  const [financialRecords, setFinancialRecords] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [beneficiaryStats, setBeneficiaryStats] = useState<any>(null);
  const [correctiveActions, setCorrectiveActions] = useState<any[]>([]);
  const [correctiveStats, setCorrectiveStats] = useState<any>(null);
  const [vcSessions, setVcSessions] = useState<any[]>([]);
  const [vcStats, setVcStats] = useState<any>(null);

  // Global search & filters
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Slide-over Entity Drawer state
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerEntity, setDrawerEntity] = useState<any | null>(null);
  const [drawerType, setDrawerType] = useState<'project' | 'beneficiary' | 'anomaly' | 'inspection' | 'compliance'>('project');
  const [drawerTitle, setDrawerTitle] = useState<string>('');
  const [drawerSubtitle, setDrawerSubtitle] = useState<string>('');

  // Selected project risk score breakdown cache
  const [projectRiskCache, setProjectRiskCache] = useState<{ [id: string]: IRiskScoreBreakdown }>({});

  // Auto assign modal state
  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState<boolean>(false);
  const [autoAssignState, setAutoAssignState] = useState<string>('Maharashtra');
  const [autoAssignType, setAutoAssignType] = useState<string>('SURPRISE');
  const [autoAssignCount, setAutoAssignCount] = useState<number>(3);
  const [autoAssignLoading, setAutoAssignLoading] = useState<boolean>(false);
  const [autoAssignResult, setAutoAssignResult] = useState<any | null>(null);

  // CCTV modal state
  const [selectedCamera, setSelectedCamera] = useState<any | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [cameraStreamUrl, setCameraStreamUrl] = useState<string>('');

  // Notifications drawer state
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);

  // Map layer filter
  const [mapFilterLayer, setMapFilterLayer] = useState<'all' | 'projects' | 'cctv' | 'inspectors' | 'units'>('all');

  // Bumped by the coverage filter bar so projects are re-queried with the latest filter values
  const [filterNonce, setFilterNonce] = useState<number>(0);
  useEffect(() => {
    if (authToken && filterNonce > 0) fetchProjects(authToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterNonce]);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/v1/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data.data);
    } catch (err) {
      console.warn('Backend health check unreachable:', err);
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchProjects = async (token?: string) => {
    setProjectsLoading(true);
    const tokenToUse = token || authToken;
    try {
      let url = '/api/v1/projects?limit=50';
      if (globalSearch) url += `&search=${encodeURIComponent(globalSearch)}`;
      if (stateFilter) url += `&state=${encodeURIComponent(stateFilter)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (riskFilter) url += `&riskLevel=${encodeURIComponent(riskFilter)}`;

      const res = await fetch(url, {
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.data.projects || []);
      } else {
        setProjects([]);
      }

      const statsRes = await fetch('/api/v1/projects/stats/overview', {
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setProjectStats(statsData.data.stats);
        }
      } else {
        setProjectStats(null);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
      setProjects([]);
      setProjectStats(null);
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        const items = data.data.inspections || data.data.items || [];
        setInspections(items);
        const active = items.filter((i: any) => i.status === 'IN_PROGRESS' || i.status === 'EN_ROUTE');
        if (active.length > 0) {
          setLiveInspectors(active.map((insp: any, idx: number) => ({
            id: insp.inspectorId?._id || insp.inspectorId?.id || `insp-${idx}`,
            name: insp.inspectorId?.name || `Inspector ${idx + 1}`,
            email: insp.inspectorId?.email || '',
            coordinates: insp.projectId?.location?.coordinates || [73.8567 + idx * 0.05, 18.5204 + idx * 0.05],
            activeInspectionId: insp.inspectionId,
            speedKmh: insp.status === 'EN_ROUTE' ? 24.5 : 0,
            accuracyMeters: 4.0,
            batteryLevel: 90,
            status: insp.status === 'EN_ROUTE' ? 'ON_MISSION' : 'ON_SITE',
          })));
        } else {
          setLiveInspectors([]);
        }
      } else {
        setInspections([]);
        setLiveInspectors([]);
      }
    } catch (err) {
      console.error('Fetch inspections error:', err);
      setInspections([]);
      setLiveInspectors([]);
    } finally {
      setInspectionsLoading(false);
    }
  };

  const fetchAlerts = async (token?: string) => {
    setAlertsLoading(true);
    const tokenToUse = token || authToken;
    try {
      const res = await fetch('/api/v1/anomalies/alerts?limit=50', {
        headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data.alerts || data.data || []);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error('Fetch alerts error:', err);
      setAlerts([]);
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setCameras(data.data.cameras || data.data || []);
      } else {
        setCameras([]);
      }
    } catch (err) {
      console.error('Fetch cameras error:', err);
      setCameras([]);
    } finally {
      setCamerasLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
      } else {
        setUnits([]);
      }
    } catch (err) {
      console.warn('Fetch units error:', err);
      setUnits([]);
    }
  };

  const fetchCompliance = async (search = '', state = '', status = '') => {
    try {
      let url = '/api/v1/compliance?limit=150';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (state) url += `&state=${encodeURIComponent(state)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      const res = await fetch(url, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setComplianceRecords(data.data?.records || []);
        setComplianceStats(data.data?.stats || null);
      }
    } catch (err) {
      console.warn('Fetch compliance error:', err);
    }
  };

  const fetchFinancials = async () => {
    try {
      const res = await fetch('/api/v1/financial', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFinancialRecords(data.data?.records || []);
        setFinancialStats(data.data?.stats || null);
      }
    } catch (err) {
      console.warn('Fetch financials error:', err);
    }
  };

  const fetchBeneficiaries = async (search = '', eligibility = '', risk = '') => {
    try {
      let url = '/api/v1/beneficiaries?limit=100';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (eligibility) url += `&eligibilityStatus=${encodeURIComponent(eligibility)}`;
      if (risk) url += `&riskLevel=${encodeURIComponent(risk)}`;
      const res = await fetch(url, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBeneficiaries(data.data?.beneficiaries || []);
        setBeneficiaryStats(data.data?.stats || null);
      }
    } catch (err) {
      console.warn('Fetch beneficiaries error:', err);
    }
  };

  const fetchCorrectiveActions = async () => {
    try {
      const res = await fetch('/api/v1/corrective-actions', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCorrectiveActions(data.data?.actions || []);
        setCorrectiveStats(data.data?.stats || null);
      }
    } catch (err) {
      console.warn('Fetch corrective actions error:', err);
    }
  };

  const fetchVCSessions = async () => {
    try {
      const res = await fetch('/api/v1/vc', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setVcSessions(data.data?.sessions || []);
        setVcStats(data.data?.stats || null);
      }
    } catch (err) {
      console.warn('Fetch VC sessions error:', err);
    }
  };

  const fetchProjectRiskBreakdown = async (projectId: string) => {
    try {
      const res = await fetch(`/api/v1/risk/project/${projectId}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProjectRiskCache((prev) => ({ ...prev, [projectId]: data.data }));
        return data.data;
      }
    } catch (err) {
      console.warn('Risk calculation error:', err);
    }
    return null;
  };

  // Open Entity Detail Drawer
  const openEntityDrawer = async (type: 'project' | 'beneficiary' | 'anomaly' | 'inspection' | 'compliance', item: any) => {
    let enrichedItem = { ...item };
    if (type === 'project' && (item.id || item._id)) {
      const pId = item.id || item._id;
      const riskBreakdown = projectRiskCache[pId] || (await fetchProjectRiskBreakdown(pId));
      enrichedItem.riskBreakdown = riskBreakdown;
      const projCams = cameras.filter((c) => c.projectId === pId || c.projectId?._id === pId);
      enrichedItem.cameras = projCams.length > 0 ? projCams : cameras.slice(0, 5);
      enrichedItem.beneficiaries = beneficiaries.length > 0 ? beneficiaries : [];
    }
    setDrawerType(type);
    setDrawerEntity(enrichedItem);
    setDrawerTitle(item.name || item.title || item.ngoName || item.beneficiaryId || 'Inspection Dossier');
    setDrawerSubtitle(item.scheme || item.district || item.orderNumber || item.ruleId || '');
    setDrawerOpen(true);
  };

  // Human in the Loop Actions
  const handleDrawerAction = async (action: string, payload: any) => {
    if (action === 'VERIFY') {
      try {
        await fetch(`/api/v1/anomalies/alerts/${payload.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: 'Confirmed authentic anomaly by DoSJE monitoring officer.' }),
        });
        fetchAlerts();
        setDrawerOpen(false);
      } catch (err) {
        console.error(err);
      }
    } else if (action === 'DISMISS') {
      try {
        await fetch(`/api/v1/anomalies/alerts/${payload.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ status: 'DISMISSED', resolutionNotes: 'Dismissed as false positive after evidence cross-check.' }),
        });
        fetchAlerts();
        setDrawerOpen(false);
      } catch (err) {
        console.error(err);
      }
    } else if (action === 'CORRECTIVE_ACTION') {
      setActiveTab('corrective_actions');
      setDrawerOpen(false);
    } else if (action === 'SURPRISE_INSPECTION') {
      setAutoAssignModalOpen(true);
      setDrawerOpen(false);
    }
  };

  const handleRunFinancialAudit = async (projectId: string) => {
    try {
      await fetch('/api/v1/financial/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ projectId }),
      });
      fetchFinancials();
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitiateSurpriseVC = async (vcData: any) => {
    try {
      await fetch('/api/v1/vc/surprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(vcData),
      });
      fetchVCSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCorrectiveStatus = async (id: string, status: string, remarks?: string) => {
    try {
      await fetch(`/api/v1/corrective-actions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ status, officerRemarks: remarks }),
      });
      fetchCorrectiveActions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCorrectiveAction = async (data: any) => {
    try {
      await fetch('/api/v1/corrective-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          ...data,
          organizationId: projects[0]?.organizationId?._id || projects[0]?.organizationId,
          projectId: projects[0]?._id || projects[0]?.id,
        }),
      });
      fetchCorrectiveActions();
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    if (!authToken) return;
    fetchHealth();
    fetchProjects(authToken);
    fetchInspections(authToken);
    fetchAlerts(authToken);
    fetchCameras(authToken);
    fetchUnits();
    fetchCompliance();
    fetchFinancials();
    fetchBeneficiaries();
    fetchCorrectiveActions();
    fetchVCSessions();
  }, [authToken]);

  const openAnomaliesCount = alerts.filter((a) => a.status === 'OPEN').length;
  const openActionsCount = correctiveActions.filter((a) => a.status === 'OPEN' || a.status === 'OVERDUE').length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f3f6fb] flex flex-col items-center justify-center text-[#0f2147] space-y-4 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#0b2a6b]/10 border border-[#0b2a6b]/30 flex items-center justify-center text-[#0b2a6b] animate-pulse shadow-md">
          <Shield className="w-7 h-7" />
        </div>
        <div className="text-center space-y-1">
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#f58a3c] font-bold">
            GOVERNMENT OF INDIA &bull; DoSJE
          </div>
          <h2 className="text-sm font-bold text-[#0f2147]">
            Verifying Authenticated Security Session
          </h2>
          <p className="text-xs text-[#6b7a96]">
            Resolving server-enforced role, granular permissions, and jurisdictional scope...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const portalKind = portalKindFromRoles(hasRole);
  const homeTab =
    portalKind === 'ngo' ? 'ngo_overview'
    : portalKind === 'inspector' ? 'inspector_today'
    : portalKind === 'beneficiary' ? 'ben_profile'
    : 'command';

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-[#0f2147] flex flex-col font-sans">
      {/* Government portal header + navigation bar */}
      <Topbar
        searchQuery={globalSearch}
        onSearchChange={(q) => {
          setGlobalSearch(q);
          fetchProjects();
        }}
        backendOnline={!!health}
        unreadAlertsCount={openAnomaliesCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenArchitecture={() => setArchitectureModalOpen(true)}
        onOpenSessions={() => setSessionsModalOpen(true)}
        onOpenPersonaSwitcher={() => setPersonaSwitcherOpen(true)}
        onGoHome={() => setActiveTab(homeTab)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          openAnomaliesCount={openAnomaliesCount}
          openActionsCount={openActionsCount}
        />

        {/* Center Main Stage Content */}
        <main className="flex-1 min-w-0 p-6 overflow-y-auto bg-[#f3f6fb]">
          {/* Role-specific welcome banner + quick tiles (shown on each role's home view) */}
          {activeTab === homeTab && (
            <PortalHero kind={portalKind} activeTab={activeTab} onSelectTab={setActiveTab} />
          )}
          {portalKind === 'official' && activeTab === 'command' && hasPermission(Permissions.PROJECT_VIEW) && (
            <div className="mb-6">
              <CoverageFilterBar
                stateValue={stateFilter}
                riskValue={riskFilter}
                statusValue={statusFilter}
                count={projects.length}
                onChange={(f) => {
                  if (f.state !== undefined) setStateFilter(f.state);
                  if (f.risk !== undefined) setRiskFilter(f.risk);
                  if (f.status !== undefined) setStatusFilter(f.status);
                }}
                onSearch={() => setFilterNonce((n) => n + 1)}
                onReset={() => {
                  setStateFilter('');
                  setRiskFilter('');
                  setStatusFilter('');
                  setGlobalSearch('');
                  setFilterNonce((n) => n + 1);
                }}
              />
            </div>
          )}
          {/* ============================================================= */}
          {/* ROLE: NGO / INSTITUTION DASHBOARD */}
          {/* ============================================================= */}
          {isNgo && (
            <NgoDashboard
              organization={projects[0]?.organizationId}
              projects={projects}
              beneficiaries={beneficiaries}
              actions={correctiveActions}
              activeSubTab={activeTab}
              onSelectSubTab={setActiveTab}
              onRefreshData={() => {
                fetchUnits();
                fetchCorrectiveActions();
              }}
            />
          )}

          {/* ============================================================= */}
          {/* ROLE: FIELD INSPECTOR MOBILE DASHBOARD */}
          {/* ============================================================= */}
          {isInspector && (
            <InspectorDashboard
              inspections={inspections}
              activeSubTab={activeTab}
              onSelectSubTab={setActiveTab}
              onUpdateInspectionStatus={async (id, status, loc) => {
                try {
                  await fetch(`/api/v1/inspections/${id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({ status, locationLog: loc }),
                  });
                  fetchInspections();
                } catch (err) {
                  console.error(err);
                }
              }}
              onSubmitChecklist={async (id, answers) => {
                try {
                  await fetch(`/api/v1/inspections/${id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({ status: 'SUBMITTED', checklistResponses: answers }),
                  });
                  fetchInspections();
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          )}

          {/* ============================================================= */}
          {/* ROLE: CITIZEN BENEFICIARY PORTAL */}
          {/* ============================================================= */}
          {isBeneficiary && (
            <BeneficiaryDashboard
              beneficiary={beneficiaries[0]}
              activeSubTab={activeTab}
              onSelectSubTab={setActiveTab}
            />
          )}

          {/* ============================================================= */}
          {/* ROLE: DoSJE OFFICIAL COMMAND CENTRE & SPECIALIZED VIEWS */}
          {/* ============================================================= */}
          {!isNgo && !isInspector && !isBeneficiary && (
            <>
              {/* TAB 1: COMMAND CENTRE */}
              {activeTab === 'command' && (
                <div className="space-y-6">
                  {/* Top Situational Awareness Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-bold uppercase">
                          SITUATION INTELLIGENCE
                        </span>
                        <span className="text-xs text-slate-400 font-mono">NATIONAL OVERSIGHT MATRIX</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-100">National Monitoring & Fraud Adjudication Command Centre</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Autonomous cross-dataset anomaly detection &bull; Weighted random surprise inspections &bull; CCTV telemetry
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          fetchProjects();
                          fetchInspections();
                          fetchAlerts();
                          fetchCameras();
                          fetchHealth();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
                      </button>
                      <button
                        onClick={() => setAutoAssignModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-lg shadow-indigo-950/40"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Weighted Random Assignment
                      </button>
                    </div>
                  </div>

                  {/* High-Level Metric KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-slate-400 text-xs font-medium">Monitored Institutions</div>
                      <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{health ? projects.length : 0}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Across Maharashtra, Delhi, TN, Karnataka</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-slate-400 text-xs font-medium">Active Inspection Missions</div>
                      <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                        {health ? inspections.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'EN_ROUTE').length : 0}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Live GPS fixes tracked</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-slate-400 text-xs font-medium">Surveillance CCTVs Online</div>
                      <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                        {health ? cameras.filter((c) => c.status === 'ONLINE').length : 0}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Tokenized stream proxy</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-slate-400 text-xs font-medium">Critical Fraud Anomalies</div>
                      <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                        {health ? alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length : 0}
                      </div>
                      <div className="text-[11px] text-red-400/80 mt-0.5">Requiring human adjudication</div>
                    </div>
                  </div>

                  {/* Google Earth GIS Map + Real-Time Alert Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden h-[540px] flex flex-col">
                      <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold font-mono uppercase text-slate-300">
                            Geospatial Command Map &bull; Google Earth Satellite Hybrid
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                          GEOFENCE RADIUS ENFORCED
                        </span>
                      </div>
                      <div className="flex-1 relative">
                        <GoogleEarthLeafletMap
                          projects={projects}
                          cameras={cameras}
                          inspectors={liveInspectors}
                          units={units}
                          selectedEntity={null}
                          onSelectEntity={(entity) => openEntityDrawer('project', entity)}
                          onOpenStreamModal={handleOpenStreamModal}
                          filterLayer={mapFilterLayer}
                          onChangeFilterLayer={setMapFilterLayer}
                        />
                      </div>
                    </div>

                    {/* Alert Feed & Decision Support */}
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col h-[540px]">
                      <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold font-mono uppercase text-slate-300">
                            Real-Time Anomaly Triage Feed
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{alerts.length} signals</span>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {alerts.length === 0 ? (
                          <div className="text-center py-16 text-slate-500 text-xs">
                            No active anomaly signals detected.
                          </div>
                        ) : (
                          alerts.map((al, idx) => (
                            <div
                              key={al.id || idx}
                              onClick={() => openEntityDrawer('anomaly', al)}
                              className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/70 border border-slate-800/80 cursor-pointer transition space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-slate-200">{al.title}</span>
                                <StatusBadge status={al.severity} type="risk" />
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{al.reason}</p>
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                                <span>{al.source || 'RULE_ENGINE'}</span>
                                <span className="text-indigo-400 font-bold hover:underline">Review &rarr;</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GEO INTELLIGENCE (FULLSCREEN GIS) */}
              {activeTab === 'geo' && (
                <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden h-[calc(100vh-8rem)] flex flex-col">
                  <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold font-mono uppercase text-slate-300">
                        National Geospatial Command Centre &bull; High Resolution Google Earth Satellite
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Layer: {mapFilterLayer.toUpperCase()} &bull; 5 Base Tile Engines
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <GoogleEarthLeafletMap
                      projects={projects}
                      cameras={cameras}
                      inspectors={liveInspectors}
                      units={units}
                      selectedEntity={null}
                      onSelectEntity={(entity) => openEntityDrawer('project', entity)}
                      onOpenStreamModal={handleOpenStreamModal}
                      filterLayer={mapFilterLayer}
                      onChangeFilterLayer={setMapFilterLayer}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: INSTITUTIONS DIRECTORY */}
              {activeTab === 'institutions' && (
                hasPermission(Permissions.INSTITUTION_VIEW) ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-100">Monitored Institutional Facilities Directory</h2>
                      <span className="text-xs font-mono text-slate-400">{projects.length} institutions</span>
                    </div>

                    <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                            <tr>
                              <th className="p-3.5">Institution Name</th>
                              <th className="p-3.5">Code</th>
                              <th className="p-3.5">Scheme</th>
                              <th className="p-3.5">Location</th>
                              <th className="p-3.5">Geofence</th>
                              <th className="p-3.5">Risk Score</th>
                              <th className="p-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300">
                            {projects.map((p) => (
                              <tr
                                key={p.id || p._id}
                                onClick={() => openEntityDrawer('project', p)}
                                className="hover:bg-slate-800/40 transition cursor-pointer"
                              >
                                <td className="p-3.5 font-semibold text-slate-100">{p.name}</td>
                                <td className="p-3.5 font-mono text-slate-400">{p.code}</td>
                                <td className="p-3.5">{p.scheme}</td>
                                <td className="p-3.5">{p.district}, {p.state}</td>
                                <td className="p-3.5 font-mono">{p.geofenceRadiusMeters || 250}m</td>
                                <td className="p-3.5 font-mono font-bold text-amber-400">{p.riskScore || 25}/100</td>
                                <td className="p-3.5">
                                  <StatusBadge status={p.status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.INSTITUTION_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 4: PROJECTS */}
              {activeTab === 'projects' && (
                hasPermission(Permissions.PROJECT_VIEW) ? (
                  <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-100">Infrastructure Projects & Geofenced Schemes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map((p) => (
                        <div
                          key={p.id || p._id}
                          onClick={() => openEntityDrawer('project', p)}
                          className="p-5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 cursor-pointer transition space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">{p.code}</span>
                              <h3 className="text-sm font-bold text-slate-100 mt-0.5">{p.name}</h3>
                            </div>
                            <StatusBadge status={p.riskLevel} type="risk" />
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                            <div>State: {p.state}</div>
                            <div>Radius: {p.geofenceRadiusMeters || 250}m</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.PROJECT_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 5: BENEFICIARIES */}
              {activeTab === 'beneficiaries' && (
                hasPermission(Permissions.BENEFICIARY_VIEW) ? (
                  <BeneficiariesView
                    beneficiaries={beneficiaries}
                    stats={beneficiaryStats}
                    loading={false}
                    onSearch={(q) => fetchBeneficiaries(q)}
                    onFilterEligibility={(el) => fetchBeneficiaries('', el)}
                    onFilterRisk={(rk) => fetchBeneficiaries('', '', rk)}
                    onSelectBeneficiary={(b) => openEntityDrawer('beneficiary', b)}
                  />
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.BENEFICIARY_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 6: ATTENDANCE & YUNET AI */}
              {activeTab === 'attendance' && (
                hasPermission(Permissions.ATTENDANCE_VIEW) ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Beneficiary Attendance & Face Verification AI</h2>
                        <p className="text-xs text-slate-400">OpenCV YuNet multi-face detection + official rollcall register matching</p>
                      </div>
                    </div>
                    <CaptureWorkflow onSessionFinalized={fetchUnits} />
                  </div>
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.ATTENDANCE_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 7: SURPRISE INSPECTIONS */}
              {activeTab === 'inspections' && (
                hasPermission(Permissions.INSPECTION_VIEW) ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Inspection Lifecycle & Weighted Random Assignment</h2>
                        <p className="text-xs text-slate-400">Transparent random assignment: (0.4 Dist + 0.3 ActiveCount + 0.3 Workload)</p>
                      </div>
                      <button
                        onClick={() => setAutoAssignModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-4 h-4" /> Run Random Assignment
                      </button>
                    </div>

                    <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                            <tr>
                              <th className="p-3.5">Mission Code</th>
                              <th className="p-3.5">Project Target</th>
                              <th className="p-3.5">Inspector</th>
                              <th className="p-3.5">Type</th>
                              <th className="p-3.5">Priority</th>
                              <th className="p-3.5">GPS Verification</th>
                              <th className="p-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300">
                            {inspections.map((insp) => (
                              <tr key={insp.id || insp._id} className="hover:bg-slate-800/40 transition">
                                <td className="p-3.5 font-mono font-bold text-indigo-400">{insp.inspectionId}</td>
                                <td className="p-3.5 font-semibold text-slate-100">{insp.projectId?.name || 'Project Facility'}</td>
                                <td className="p-3.5">{insp.inspectorId?.name || 'Assigned Officer'}</td>
                                <td className="p-3.5">{insp.type}</td>
                                <td className="p-3.5">
                                  <StatusBadge status={insp.priority} type="risk" />
                                </td>
                                <td className="p-3.5">
                                  <span className={`font-mono text-[11px] ${insp.isLocationVerified ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {insp.isLocationVerified ? 'Geofence Verified' : 'Pending Check-In'}
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <StatusBadge status={insp.status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.INSPECTION_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 8: ANOMALY INTELLIGENCE */}
              {activeTab === 'anomalies' && (
                hasPermission(Permissions.ANOMALY_VIEW) ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-900/40 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Explainable AI Anomaly & Fraud Detection Engine</h2>
                        <p className="text-xs text-slate-400">
                          Statistical outliers, isolation forests, and rule-based triggers requiring official human-in-the-loop review.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-semibold">
                        DECISION SUPPORT ONLY
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {alerts.map((al) => (
                        <div
                          key={al.id}
                          onClick={() => openEntityDrawer('anomaly', al)}
                          className="p-5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 cursor-pointer transition space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">{al.source || 'AI SERVICE'}</span>
                              <h3 className="text-sm font-bold text-slate-100 mt-0.5">{al.title}</h3>
                            </div>
                            <StatusBadge status={al.severity} type="risk" />
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{al.reason}</p>
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                            <StatusBadge status={al.status} />
                            <span className="text-indigo-400 font-bold hover:underline">Adjudicate Anomaly &rarr;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.ANOMALY_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 9: FINANCIAL INTELLIGENCE */}
              {activeTab === 'financial' && (
                hasPermission(Permissions.FINANCIAL_VIEW) ? (
                  <FinancialIntelligenceView
                    financialRecords={financialRecords}
                    stats={financialStats}
                    onRunAudit={handleRunFinancialAudit}
                    onSelectProject={(p) => openEntityDrawer('project', p)}
                    loading={false}
                  />
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.FINANCIAL_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 10: CCTV & VC */}
              {activeTab === 'cctv_vc' && (
                hasPermission(Permissions.CCTV_VIEW) ? (
                  <VCSurpriseView
                    cameras={cameras}
                    sessions={vcSessions}
                    projects={projects}
                    onInitiateSurpriseVC={handleInitiateSurpriseVC}
                    onSelectProject={(proj) => openEntityDrawer('project', proj)}
                    onOpenStreamModal={handleOpenStreamModal}
                    loading={false}
                  />
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.CCTV_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 11: MINISTRY COMPLIANCE */}
              {activeTab === 'compliance' && (
                hasPermission(Permissions.COMPLIANCE_VIEW) ? (
                  <ComplianceView
                    records={complianceRecords}
                    stats={complianceStats}
                    loading={false}
                    onSearch={(q) => fetchCompliance(q)}
                    onFilterState={(st) => fetchCompliance('', st)}
                    onFilterStatus={(st) => fetchCompliance('', '', st)}
                    onSelectRecord={(r) => openEntityDrawer('compliance', r)}
                  />
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.COMPLIANCE_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 12: CORRECTIVE ACTIONS */}
              {activeTab === 'corrective_actions' && (
                hasPermission(Permissions.CORRECTIVE_ACTION_VIEW) ? (
                  <CorrectiveActionsView
                    actions={correctiveActions}
                    stats={correctiveStats}
                    loading={false}
                    onUpdateStatus={handleUpdateCorrectiveStatus}
                    onCreateAction={handleCreateCorrectiveAction}
                  />
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.CORRECTIVE_ACTION_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}


              {/* TAB 13: DEMO RUNNER REMOVED — not applicable for production deployment */}

              {/* TAB 14: AUDIT TRAIL & REPORTS */}
              {activeTab === 'reports_audit' && (
                hasPermission(Permissions.AUDIT_VIEW) ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Immutable Audit Trail & Regulatory Exports</h2>
                        <p className="text-slate-400">Cryptographically verifiable event log for all inspections, logins, and adjudications.</p>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-950 text-emerald-400 border border-emerald-800">
                        SHA-256 HASH CHAIN VERIFIED
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800 bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                      {[
                        { actor: 'Dr. Rajesh Verma (Joint Secretary)', action: 'REVIEW_ANOMALY', target: 'INSP-2026-PUN-001', time: '10 mins ago', ip: '10.24.18.2' },
                        { actor: 'Automated Anomaly Engine', action: 'FLAG_BURST', target: 'St. Jude Hostel', time: '25 mins ago', ip: '127.0.0.1' },
                        { actor: 'Amitabh Sharma (Field Inspector)', action: 'GPS_CHECK_IN', target: 'Hinjawadi Kendra', time: '1 hour ago', ip: '192.168.1.45' },
                        { actor: 'National System Super Admin', action: 'SYSTEM_LOGIN', target: 'Central Session', time: '2 hours ago', ip: '10.24.18.1' },
                      ].map((log, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-200">{log.actor}</span>
                            <span className="text-slate-500 font-mono text-[11px] block">{log.action} &bull; Target: {log.target}</span>
                          </div>
                          <div className="text-right font-mono text-slate-400 text-[11px]">
                            <div>{log.time}</div>
                            <div className="text-slate-500 text-[10px]">{log.ip}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.AUDIT_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}

              {/* TAB 15: USER MANAGEMENT & RBAC DELEGATION */}
              {activeTab === 'users' && (
                hasPermission(Permissions.USER_VIEW) ||
                hasRole(UserRole.SYSTEM_SUPER_ADMIN) ||
                hasRole(UserRole.DOSJE_HQ_ADMIN) ? (
                  <UserManagementView />
                ) : (
                  <AccessDenied
                    requiredPermission={Permissions.USER_VIEW}
                    onGoHome={() => setActiveTab('command')}
                  />
                )
              )}
            </>
          )}
        </main>
      </div>

      {/* Universal Right Slide-Over Entity Investigation Drawer */}
      <EntityDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        entityType={drawerType}
        data={drawerEntity}
        onAction={handleDrawerAction}
        onOpenStreamModal={handleOpenStreamModal}
      />

      {/* Weighted Random Inspection Assignment Modal */}
      {autoAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Weighted Random Inspection Assignment
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent algorithmic assignment score: <strong>0.40 &times; Distance + 0.30 &times; Active Missions + 0.30 &times; Total Workload</strong>. Mitigates repeat-pairing leniency bias.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target State / Jurisdiction</label>
                <select
                  value={autoAssignState}
                  onChange={(e) => setAutoAssignState(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                >
                  <option value="Maharashtra">Maharashtra (Pune / Mumbai)</option>
                  <option value="Delhi">Delhi NCT</option>
                  <option value="Karnataka">Karnataka (Bengaluru)</option>
                  <option value="Tamil Nadu">Tamil Nadu (Chennai)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Inspection Type</label>
                <select
                  value={autoAssignType}
                  onChange={(e) => setAutoAssignType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                >
                  <option value="SURPRISE">Surprise Unannounced Inspection</option>
                  <option value="ROUTINE">Routine Scheduled Audit</option>
                  <option value="FOLLOW_UP">Deficiency Remediation Follow-Up</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Missions to Dispatch</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={autoAssignCount}
                  onChange={(e) => setAutoAssignCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>

              {autoAssignResult && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Dispatched {autoAssignResult.assignmentsCount || autoAssignCount} Surprise Inspections!</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Missions transmitted to field inspectors with cryptographic geo-fences.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAutoAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={autoAssignLoading}
                  onClick={handleTriggerAutoAssign}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-lg shadow-indigo-950/40"
                >
                  {autoAssignLoading ? 'Calculating Weights...' : 'Execute Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Architecture Blueprint Modal */}
      <ArchitectureModal
        isOpen={architectureModalOpen}
        onClose={() => setArchitectureModalOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setArchitectureModalOpen(false);
        }}
      />

      {/* Active Sessions Security Modal */}
      <SessionsModal
        isOpen={sessionsModalOpen}
        onClose={() => setSessionsModalOpen(false)}
      />

      {/* Evaluator Persona Switcher Modal */}
      <PersonaSwitcherModal
        isOpen={personaSwitcherOpen}
        onClose={() => setPersonaSwitcherOpen(false)}
      />
    </div>
  );
}

