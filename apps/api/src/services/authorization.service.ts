import { UserRole, Permissions, DataScopeLevel, IDataScope, IUser } from '@nirikshan/shared-types';

/**
 * Government Hierarchy & Role-to-Permissions Mapping
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  // 1. Super Administrator (Full system privileges)
  [UserRole.SUPER_ADMIN]: Object.values(Permissions),
  [UserRole.SYSTEM_SUPER_ADMIN]: Object.values(Permissions),

  // 2. DoSJE HQ Administrator
  [UserRole.DOSJE_HQ_ADMIN]: [
    Permissions.INSTITUTION_READ,
    Permissions.INSTITUTION_CREATE,
    Permissions.INSTITUTION_UPDATE,
    Permissions.INSTITUTION_SUSPEND,
    Permissions.INSTITUTION_REVIEW,
    Permissions.PROJECT_READ,
    Permissions.PROJECT_CREATE,
    Permissions.PROJECT_UPDATE,
    Permissions.BENEFICIARY_READ,
    Permissions.BENEFICIARY_CREATE,
    Permissions.BENEFICIARY_UPDATE,
    Permissions.BENEFICIARY_VERIFY,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_REVIEW,
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_CREATE,
    Permissions.INSPECTION_ASSIGN,
    Permissions.INSPECTION_REVIEW,
    Permissions.INSPECTION_APPROVE,
    Permissions.ANOMALY_READ,
    Permissions.ANOMALY_REVIEW,
    Permissions.ANOMALY_DISMISS,
    Permissions.ANOMALY_ESCALATE,
    Permissions.FINANCIAL_READ,
    Permissions.FINANCIAL_REVIEW,
    Permissions.FINANCIAL_APPROVE,
    Permissions.COMPLIANCE_READ,
    Permissions.COMPLIANCE_UPDATE,
    Permissions.COMPLIANCE_REVIEW,
    Permissions.CCTV_READ,
    Permissions.CCTV_CONTROL,
    Permissions.VC_CREATE,
    Permissions.VC_JOIN,
    Permissions.VC_REVIEW,
    Permissions.CORRECTIVE_ACTION_CREATE,
    Permissions.CORRECTIVE_ACTION_ASSIGN,
    Permissions.CORRECTIVE_ACTION_CLOSE,
    Permissions.REPORT_READ,
    Permissions.REPORT_EXPORT,
    Permissions.AUDIT_READ,
    Permissions.USER_READ,
    Permissions.USER_CREATE,
    Permissions.USER_UPDATE,
    Permissions.USER_DISABLE,
    Permissions.SECURITY_MANAGE,
  ],

  // 3. DoSJE HQ Monitoring Officer (Joint Secretary / Director Level)
  [UserRole.DEPARTMENT_OFFICIAL]: [
    Permissions.INSTITUTION_READ,
    Permissions.INSTITUTION_REVIEW,
    Permissions.PROJECT_READ,
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_REVIEW,
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_CREATE,
    Permissions.INSPECTION_ASSIGN,
    Permissions.INSPECTION_REVIEW,
    Permissions.INSPECTION_APPROVE,
    Permissions.ANOMALY_READ,
    Permissions.ANOMALY_REVIEW,
    Permissions.ANOMALY_DISMISS,
    Permissions.ANOMALY_ESCALATE,
    Permissions.FINANCIAL_READ,
    Permissions.FINANCIAL_REVIEW,
    Permissions.COMPLIANCE_READ,
    Permissions.COMPLIANCE_REVIEW,
    Permissions.CCTV_READ,
    Permissions.VC_CREATE,
    Permissions.VC_JOIN,
    Permissions.VC_REVIEW,
    Permissions.CORRECTIVE_ACTION_CREATE,
    Permissions.CORRECTIVE_ACTION_ASSIGN,
    Permissions.CORRECTIVE_ACTION_CLOSE,
    Permissions.REPORT_READ,
    Permissions.REPORT_EXPORT,
    Permissions.AUDIT_READ,
  ],
  [UserRole.DOSJE_HQ_OFFICIAL]: [
    Permissions.INSTITUTION_READ,
    Permissions.INSTITUTION_REVIEW,
    Permissions.PROJECT_READ,
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_REVIEW,
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_CREATE,
    Permissions.INSPECTION_ASSIGN,
    Permissions.INSPECTION_REVIEW,
    Permissions.INSPECTION_APPROVE,
    Permissions.ANOMALY_READ,
    Permissions.ANOMALY_REVIEW,
    Permissions.ANOMALY_DISMISS,
    Permissions.ANOMALY_ESCALATE,
    Permissions.FINANCIAL_READ,
    Permissions.FINANCIAL_REVIEW,
    Permissions.COMPLIANCE_READ,
    Permissions.COMPLIANCE_REVIEW,
    Permissions.CCTV_READ,
    Permissions.VC_CREATE,
    Permissions.VC_JOIN,
    Permissions.VC_REVIEW,
    Permissions.CORRECTIVE_ACTION_CREATE,
    Permissions.CORRECTIVE_ACTION_ASSIGN,
    Permissions.CORRECTIVE_ACTION_CLOSE,
    Permissions.REPORT_READ,
    Permissions.REPORT_EXPORT,
    Permissions.AUDIT_READ,
  ],

  // 4. State Official (State Monitoring Centre)
  [UserRole.STATE_AUTHORITY]: [
    Permissions.INSTITUTION_READ,
    Permissions.PROJECT_READ,
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_CREATE,
    Permissions.INSPECTION_ASSIGN,
    Permissions.ANOMALY_READ,
    Permissions.ANOMALY_REVIEW,
    Permissions.FINANCIAL_READ,
    Permissions.COMPLIANCE_READ,
    Permissions.CCTV_READ,
    Permissions.VC_JOIN,
    Permissions.CORRECTIVE_ACTION_CREATE,
    Permissions.CORRECTIVE_ACTION_ASSIGN,
    Permissions.REPORT_READ,
  ],
  [UserRole.DOSJE_STATE_OFFICIAL]: [
    Permissions.INSTITUTION_READ,
    Permissions.PROJECT_READ,
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_CREATE,
    Permissions.INSPECTION_ASSIGN,
    Permissions.ANOMALY_READ,
    Permissions.ANOMALY_REVIEW,
    Permissions.FINANCIAL_READ,
    Permissions.COMPLIANCE_READ,
    Permissions.CCTV_READ,
    Permissions.VC_JOIN,
    Permissions.CORRECTIVE_ACTION_CREATE,
    Permissions.CORRECTIVE_ACTION_ASSIGN,
    Permissions.REPORT_READ,
  ],

  // 5. District Official (District Monitoring Centre)
  [UserRole.DISTRICT_AUTHORITY]: [
    Permissions.INSTITUTION_READ,
    Permissions.PROJECT_READ,
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.INSPECTION_READ,
    Permissions.ANOMALY_READ,
    Permissions.CORRECTIVE_ACTION_CREATE,
    Permissions.REPORT_READ,
  ],
  [UserRole.DOSJE_DISTRICT_OFFICIAL]: [
    Permissions.INSTITUTION_READ,
    Permissions.PROJECT_READ,
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.INSPECTION_READ,
    Permissions.ANOMALY_READ,
    Permissions.CORRECTIVE_ACTION_CREATE,
    Permissions.REPORT_READ,
  ],

  // 6. PMU Inspection Manager
  [UserRole.PMU_OFFICER]: [
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_CREATE,
    Permissions.INSPECTION_ASSIGN,
    Permissions.INSPECTION_REVIEW,
    Permissions.ANOMALY_READ,
    Permissions.CCTV_READ,
    Permissions.VC_JOIN,
    Permissions.REPORT_READ,
  ],
  [UserRole.PMU_MANAGER]: [
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_CREATE,
    Permissions.INSPECTION_ASSIGN,
    Permissions.INSPECTION_REVIEW,
    Permissions.ANOMALY_READ,
    Permissions.CCTV_READ,
    Permissions.VC_JOIN,
    Permissions.REPORT_READ,
  ],

  // 7. Field Inspector (Mobile Field App)
  [UserRole.INSPECTOR]: [
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_EXECUTE,
    Permissions.ATTENDANCE_READ,
    Permissions.CCTV_READ,
  ],
  [UserRole.PMU_INSPECTOR]: [
    Permissions.INSPECTION_READ,
    Permissions.INSPECTION_EXECUTE,
    Permissions.ATTENDANCE_READ,
    Permissions.CCTV_READ,
  ],

  // 8. NGO / Institution Admin
  [UserRole.INSTITUTE_ADMIN]: [
    Permissions.INSTITUTION_READ,
    Permissions.INSTITUTION_UPDATE,
    Permissions.PROJECT_READ,
    Permissions.BENEFICIARY_READ,
    Permissions.BENEFICIARY_CREATE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_CREATE,
    Permissions.FINANCIAL_READ,
    Permissions.FINANCIAL_SUBMIT,
    Permissions.INSPECTION_READ,
    Permissions.COMPLIANCE_READ,
    Permissions.CORRECTIVE_ACTION_ASSIGN,
  ],
  [UserRole.NGO_ADMIN]: [
    Permissions.INSTITUTION_READ,
    Permissions.INSTITUTION_UPDATE,
    Permissions.PROJECT_READ,
    Permissions.BENEFICIARY_READ,
    Permissions.BENEFICIARY_CREATE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_CREATE,
    Permissions.FINANCIAL_READ,
    Permissions.FINANCIAL_SUBMIT,
    Permissions.INSPECTION_READ,
    Permissions.COMPLIANCE_READ,
    Permissions.CORRECTIVE_ACTION_ASSIGN,
  ],

  // 9. NGO Staff / Daily Operations
  [UserRole.PROJECT_STAFF]: [
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_CREATE,
  ],
  [UserRole.NGO_STAFF]: [
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_CREATE,
  ],

  // 10. Citizen Beneficiary
  [UserRole.BENEFICIARY]: [
    Permissions.BENEFICIARY_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.REPORT_READ,
  ],

  // 11. Auditor (Read-only cross-evidence)
  [UserRole.AUDITOR]: [
    Permissions.AUDIT_READ,
    Permissions.INSPECTION_READ,
    Permissions.FINANCIAL_READ,
    Permissions.COMPLIANCE_READ,
    Permissions.REPORT_READ,
    Permissions.REPORT_EXPORT,
  ],

  // 12. Finance Officer
  [UserRole.FINANCE_OFFICER]: [
    Permissions.FINANCIAL_READ,
    Permissions.FINANCIAL_REVIEW,
    Permissions.FINANCIAL_APPROVE,
    Permissions.REPORT_READ,
  ],

  // 13. Compliance Officer
  [UserRole.COMPLIANCE_OFFICER]: [
    Permissions.COMPLIANCE_READ,
    Permissions.COMPLIANCE_UPDATE,
    Permissions.COMPLIANCE_REVIEW,
    Permissions.CORRECTIVE_ACTION_CLOSE,
    Permissions.REPORT_READ,
  ],

  // 14. View-Only Observer
  [UserRole.VIEW_ONLY_OFFICIAL]: [
    Permissions.INSTITUTION_READ,
    Permissions.PROJECT_READ,
    Permissions.REPORT_READ,
  ],
};

export class AuthorizationService {
  /**
   * Resolve user permissions based on primary role + temporary access grant
   */
  public static getUserPermissions(user: IUser): string[] {
    const roleKey = user.role as string;
    const basePermissions = ROLE_PERMISSIONS[roleKey] || [];

    // Check temporary access if active
    if (user.temporaryAccess) {
      const now = new Date();
      const start = new Date(user.temporaryAccess.effectiveFrom);
      const end = new Date(user.temporaryAccess.effectiveUntil);
      if (now >= start && now <= end) {
        const tempPerms = ROLE_PERMISSIONS[user.temporaryAccess.role as string] || [];
        return Array.from(new Set([...basePermissions, ...tempPerms]));
      }
    }

    return basePermissions;
  }

  /**
   * Check if user possesses required permission
   */
  public static hasPermission(user: IUser, requiredPermission: string): boolean {
    const perms = this.getUserPermissions(user);
    return perms.includes(requiredPermission);
  }

  /**
   * Resolve data scope level and jurisdiction bounds
   */
  public static resolveUserScope(user: IUser): IDataScope {
    // Check temporary elevated access first
    if (user.temporaryAccess) {
      const now = new Date();
      const start = new Date(user.temporaryAccess.effectiveFrom);
      const end = new Date(user.temporaryAccess.effectiveUntil);
      if (now >= start && now <= end && user.temporaryAccess.scope) {
        return user.temporaryAccess.scope;
      }
    }

    const r = user.role;

    // National Level Scope
    if (
      r === UserRole.SUPER_ADMIN ||
      r === UserRole.SYSTEM_SUPER_ADMIN ||
      r === UserRole.DOSJE_HQ_ADMIN ||
      r === UserRole.DEPARTMENT_OFFICIAL ||
      r === UserRole.DOSJE_HQ_OFFICIAL ||
      r === UserRole.AUDITOR ||
      r === UserRole.FINANCE_OFFICER ||
      r === UserRole.COMPLIANCE_OFFICER ||
      r === UserRole.VIEW_ONLY_OFFICIAL
    ) {
      return { level: DataScopeLevel.NATIONAL };
    }

    // State Level Scope
    if (r === UserRole.STATE_AUTHORITY || r === UserRole.DOSJE_STATE_OFFICIAL) {
      return {
        level: DataScopeLevel.STATE,
        stateIds: user.state ? [user.state] : [],
      };
    }

    // District Level Scope
    if (r === UserRole.DISTRICT_AUTHORITY || r === UserRole.DOSJE_DISTRICT_OFFICIAL) {
      return {
        level: DataScopeLevel.DISTRICT,
        stateIds: user.state ? [user.state] : [],
        districtIds: user.district ? [user.district] : [],
      };
    }

    // Organization Scope (NGO / Institution)
    if (
      r === UserRole.INSTITUTE_ADMIN ||
      r === UserRole.NGO_ADMIN ||
      r === UserRole.NGO_PROJECT_MANAGER ||
      r === UserRole.PROJECT_STAFF ||
      r === UserRole.NGO_STAFF
    ) {
      return {
        level: DataScopeLevel.ORGANIZATION,
        organizationIds: user.organizationId ? [user.organizationId.toString()] : [],
      };
    }

    // Inspector Scope (Assigned field visits only)
    if (r === UserRole.INSPECTOR || r === UserRole.PMU_INSPECTOR || r === UserRole.PMU_OFFICER || r === UserRole.PMU_MANAGER) {
      return {
        level: DataScopeLevel.ASSIGNED_INSPECTIONS,
      };
    }

    // Beneficiary Scope (Self only)
    if (r === UserRole.BENEFICIARY) {
      return {
        level: DataScopeLevel.SELF,
        beneficiaryId: user.id,
      };
    }

    return { level: DataScopeLevel.SELF };
  }

  /**
   * Build MongoDB query filter enforcing data scope on database level
   */
  public static buildScopeFilter(
    user: IUser,
    resourceType: 'project' | 'institution' | 'inspection' | 'beneficiary' | 'financial' | 'anomaly' | 'compliance' | 'correctiveAction',
  ): Record<string, any> {
    const scope = this.resolveUserScope(user);

    // National scope sees all records without restriction
    if (scope.level === DataScopeLevel.NATIONAL) {
      return {};
    }

    // State scope filter
    if (scope.level === DataScopeLevel.STATE) {
      const stateName = user.state;
      if (!stateName) return { _id: null }; // Unassigned state cannot see records

      if (resourceType === 'project' || resourceType === 'beneficiary' || resourceType === 'compliance') {
        return { state: stateName };
      }
      if (resourceType === 'institution') {
        return { state: stateName };
      }
      return {};
    }

    // District scope filter
    if (scope.level === DataScopeLevel.DISTRICT) {
      const stateName = user.state;
      const districtName = user.district;
      if (!districtName) return { _id: null };

      if (resourceType === 'project' || resourceType === 'beneficiary') {
        return { state: stateName, district: districtName };
      }
      if (resourceType === 'institution') {
        return { state: stateName, district: districtName };
      }
      return {};
    }

    // Organization scope filter (NGO)
    if (scope.level === DataScopeLevel.ORGANIZATION) {
      const orgId = user.organizationId;
      if (!orgId) return { _id: null };

      if (resourceType === 'project') {
        return { organizationId: orgId };
      }
      if (resourceType === 'institution') {
        return { _id: orgId };
      }
      if (resourceType === 'beneficiary' || resourceType === 'financial' || resourceType === 'correctiveAction') {
        return { organizationId: orgId };
      }
      return { organizationId: orgId };
    }

    // Field Inspector Scope (Assigned Work Only)
    if (scope.level === DataScopeLevel.ASSIGNED_INSPECTIONS) {
      if (resourceType === 'inspection') {
        return { inspectorId: user.id };
      }
      // Inspectors cannot see unassigned beneficiaries or general financial audits
      if (resourceType === 'beneficiary') {
        return { _id: null };
      }
      return {};
    }

    // Citizen Beneficiary Scope (Self Only)
    if (scope.level === DataScopeLevel.SELF) {
      if (resourceType === 'beneficiary') {
        return {
          $or: [
            { email: user.email.toLowerCase() },
            { phone: user.phoneNumber },
            { _id: user.id },
          ],
        };
      }
      // Beneficiaries cannot access internal NGO finances, inspections or government anomalies
      return { _id: null };
    }

    return { _id: null };
  }

  /**
   * Object-Level Authorization: verify if a single resource instance is within the user's scope (Prevents IDOR!)
   */
  public static canAccessObject(
    user: IUser,
    resource: any,
    resourceType: 'project' | 'institution' | 'inspection' | 'beneficiary' | 'financial' | 'compliance',
  ): boolean {
    const scope = this.resolveUserScope(user);
    if (scope.level === DataScopeLevel.NATIONAL) return true;

    if (!resource) return false;

    if (scope.level === DataScopeLevel.STATE) {
      return resource.state === user.state;
    }

    if (scope.level === DataScopeLevel.DISTRICT) {
      return resource.state === user.state && resource.district === user.district;
    }

    if (scope.level === DataScopeLevel.ORGANIZATION) {
      const orgIdStr = user.organizationId?.toString();
      const resOrgIdStr = (resource.organizationId?._id || resource.organizationId || resource._id)?.toString();
      return orgIdStr === resOrgIdStr;
    }

    if (scope.level === DataScopeLevel.ASSIGNED_INSPECTIONS) {
      if (resourceType === 'inspection') {
        return resource.inspectorId?.toString() === user.id.toString();
      }
      return false;
    }

    if (scope.level === DataScopeLevel.SELF) {
      if (resourceType === 'beneficiary') {
        return (
          resource._id?.toString() === user.id.toString() ||
          resource.email?.toLowerCase() === user.email.toLowerCase()
        );
      }
      return false;
    }

    return false;
  }
}
