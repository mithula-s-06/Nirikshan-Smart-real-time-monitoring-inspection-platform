import React from 'react';
import {
  LayoutDashboard,
  Building,
  Briefcase,
  Users,
  Camera,
  ClipboardCheck,
  ShieldAlert,
  Coins,
  Video,
  MapPin,
  FileCheck,
  CheckSquare,
  Sparkles,
  UserCheck,
  UploadCloud,
  HelpCircle,
  Clock,
  History,
  UserCog,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Permissions } from '@nirikshan/shared-types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  openAnomaliesCount?: number;
  openActionsCount?: number;
  currentRole?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openAnomaliesCount = 0,
  openActionsCount = 0,
}) => {
  const { user, hasPermission, hasRole } = useAuth();

  const isNgo =
    hasRole(UserRole.NGO_ADMIN) ||
    hasRole(UserRole.NGO_PROJECT_MANAGER) ||
    hasRole(UserRole.NGO_STAFF);

  const isInspector = hasRole(UserRole.PMU_INSPECTOR);
  const isBeneficiary = hasRole(UserRole.BENEFICIARY);

  // Navigation config per role and permissions
  const getNavSections = () => {
    if (isNgo) {
      return [
        {
          title: 'INSTITUTION OPERATIONS',
          items: [
            { id: 'ngo_overview', label: 'Institution Overview', icon: LayoutDashboard },
            { id: 'ngo_beneficiaries', label: 'Active Beneficiaries', icon: Users },
            { id: 'ngo_rollcall', label: 'Beneficiary Attendance (AI)', icon: Camera },
            { id: 'ngo_staff', label: 'Staff Selfie Check-In', icon: UserCheck },
          ],
        },
        {
          title: 'REPORTING & COMPLIANCE',
          items: [
            { id: 'ngo_financial', label: 'Financial Grant Utilization', icon: Coins },
            { id: 'ngo_inspections', label: 'Field Inspections History', icon: ClipboardCheck },
            { id: 'ngo_compliance', label: 'Official Notices & Directives', icon: FileCheck, badge: openActionsCount },
          ],
        },
      ];
    }

    if (isInspector) {
      return [
        {
          title: 'FIELD INSPECTOR PORTAL',
          items: [
            { id: 'inspector_assignments', label: 'My Assigned Missions', icon: ClipboardCheck },
            { id: 'inspector_today', label: "Today's Inspection Mission", icon: MapPin },
            { id: 'inspector_checklist', label: 'Digital Checklist', icon: CheckSquare },
            { id: 'inspector_evidence', label: 'Evidence Capture & Hash', icon: UploadCloud },
            { id: 'inspector_sync', label: 'Offline Batch Sync', icon: History },
          ],
        },
      ];
    }

    if (isBeneficiary) {
      return [
        {
          title: 'CITIZEN BENEFICIARY PORTAL',
          items: [
            { id: 'ben_profile', label: 'My Citizen Profile', icon: UserCheck },
            { id: 'ben_scheme', label: 'Scheme Entitlements', icon: Briefcase },
            { id: 'ben_attendance', label: 'My Attendance Record', icon: Clock },
            { id: 'ben_support', label: 'Support & Grievance', icon: HelpCircle },
          ],
        },
      ];
    }

    // Official / Admin / Auditor / PMU Manager / Regional Officers
    const monitoringItems: any[] = [
      { id: 'command', label: 'Command Centre', icon: LayoutDashboard },
      { id: 'geo', label: 'GIS & Satellite Map', icon: MapPin },
    ];
    if (hasPermission(Permissions.INSTITUTION_VIEW)) {
      monitoringItems.push({ id: 'institutions', label: 'NGO / Institutions', icon: Building });
    }
    if (hasPermission(Permissions.PROJECT_VIEW)) {
      monitoringItems.push({ id: 'projects', label: 'Projects & Schemes', icon: Briefcase });
    }
    if (hasPermission(Permissions.BENEFICIARY_VIEW)) {
      monitoringItems.push({ id: 'beneficiaries', label: 'Beneficiary Registry', icon: Users });
    }

    const intelligenceItems: any[] = [];
    if (hasPermission(Permissions.ANOMALY_VIEW)) {
      intelligenceItems.push({
        id: 'anomalies',
        label: 'Anomaly Engine (Rules 1–30)',
        icon: ShieldAlert,
        badge: openAnomaliesCount,
      });
    }
    if (hasPermission(Permissions.ATTENDANCE_VIEW)) {
      intelligenceItems.push({ id: 'attendance', label: 'Attendance AI (YuNet + SFace)', icon: Camera });
    }
    // demo_story removed — not applicable for production deployment

    const operationsItems: any[] = [];
    if (hasPermission(Permissions.INSPECTION_VIEW)) {
      operationsItems.push({ id: 'inspections', label: 'Surprise Inspections', icon: ClipboardCheck });
    }
    if (hasPermission(Permissions.FINANCIAL_VIEW)) {
      operationsItems.push({ id: 'financial', label: 'Financial Audits (Rules 16–22)', icon: Coins });
    }
    if (hasPermission(Permissions.COMPLIANCE_VIEW)) {
      operationsItems.push({ id: 'compliance', label: 'Ministry Gazette (121 Recs)', icon: FileCheck });
    }
    if (hasPermission(Permissions.CCTV_VIEW)) {
      operationsItems.push({ id: 'cctv_vc', label: 'CCTV & Surprise VC Matrix', icon: Video });
    }
    if (hasPermission(Permissions.CORRECTIVE_ACTION_VIEW)) {
      operationsItems.push({
        id: 'corrective_actions',
        label: 'Corrective Action Directives',
        icon: CheckSquare,
        badge: openActionsCount,
      });
    }
    if (hasPermission(Permissions.AUDIT_VIEW)) {
      operationsItems.push({ id: 'reports_audit', label: 'Audit Trail & Logs', icon: History });
    }

    const sections: any[] = [
      {
        title: '1. MONITORING PILLAR',
        items: monitoringItems,
      },
      {
        title: '2. INTELLIGENCE PILLAR',
        items: intelligenceItems,
      },
      {
        title: '3. OPERATIONS PILLAR',
        items: operationsItems,
      },
    ];

    if (
      hasPermission(Permissions.USER_VIEW) ||
      hasRole(UserRole.SYSTEM_SUPER_ADMIN) ||
      hasRole(UserRole.DOSJE_HQ_ADMIN)
    ) {
      sections.push({
        title: '4. ADMINISTRATION',
        items: [
          { id: 'users', label: 'User & RBAC Delegation', icon: UserCog },
        ],
      });
    }

    return sections;
  };

  const sections = getNavSections();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-[#d6deec] flex flex-col self-start sticky top-[9.75rem] max-h-[calc(100vh-9.75rem)] select-none overflow-y-auto shadow-sm z-20">
      <div className="p-3.5 pt-4 space-y-5 flex-1">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <h3 className="px-3 py-1.5 text-[10.5px] font-extrabold tracking-wider text-[#0b2a6b] uppercase border-l-4 border-[#f58a3c] bg-[#f0f4fa] rounded-r">
              {section.title}
            </h3>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item: any) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0b2a6b] text-white shadow-sm'
                        : 'text-[#324568] hover:text-[#0b2a6b] hover:bg-[#eaf0fb]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#0b2a6b]'}`} />
                      <span className="text-left font-medium">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-[#f58a3c] text-white' : 'bg-[#e0701f] text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Principle footer */}
      <div className="p-3 m-3 rounded-xl bg-[#f0f4fa] border border-[#d6deec] text-[11px] text-[#4d5d7c]">
        <div className="font-bold text-[#0b2a6b] flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#f58a3c]" />
          <span>Automate the Work</span>
        </div>
        <p className="text-[10px] text-[#4d5d7c] mt-1 leading-normal">
          Not the decision. Official review and audit verification required for every flagged signal.
        </p>
      </div>

    </aside>
  );
};
