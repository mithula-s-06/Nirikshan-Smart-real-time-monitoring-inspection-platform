import { ProjectStatus, RiskLevel, AuditAction, UserRole } from '@nirikshan/shared-types';
import { Project, IProjectDocument } from '../models/project.model';
import { Organization } from '../models/organization.model';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { recordAudit } from './audit.service';

export interface GetProjectsQuery {
  page?: number;
  limit?: number;
  search?: string;
  state?: string;
  district?: string;
  scheme?: string;
  status?: ProjectStatus;
  riskLevel?: RiskLevel;
  organizationId?: string;
}

export class ProjectService {
  public static async createProject(
    input: any,
    creator?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    // 1. Verify Organization exists
    const org = await Organization.findById(input.organizationId);
    if (!org) {
      throw new ValidationError(`Referenced organization with ID '${input.organizationId}' does not exist.`);
    }

    // 2. Check code uniqueness
    const existing = await Project.findOne({ code: input.code.toUpperCase() });
    if (existing) {
      throw new ConflictError(`Project with code '${input.code}' already exists.`);
    }

    // 3. Create Project
    const project = await Project.create({
      ...input,
      code: input.code.toUpperCase(),
    });

    if (creator) {
      await recordAudit({
        actorId: creator.id,
        actorEmail: creator.email,
        actorRole: creator.role,
        action: AuditAction.CONFIG_MODIFIED,
        resource: 'Project',
        resourceId: project._id.toString(),
        ipAddress,
        userAgent,
        requestId,
        details: { name: project.name, code: project.code, scheme: project.scheme, riskLevel: project.riskLevel },
      });
    }

    return project.toJSON();
  }

  public static async getProjects(query: GetProjectsQuery, scopeFilter: Record<string, any> = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { ...scopeFilter };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.riskLevel) {
      filter.riskLevel = query.riskLevel;
    }
    if (query.scheme) {
      filter.scheme = new RegExp(query.scheme, 'i');
    }
    if (query.state) {
      filter.state = new RegExp(query.state, 'i');
    }
    if (query.district) {
      filter.district = new RegExp(query.district, 'i');
    }
    if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [{ name: searchRegex }, { code: searchRegex }, { scheme: searchRegex }, { address: searchRegex }];
    }

    const [items, total] = await Promise.all([
      Project.find(filter)
        .populate('organizationId', 'name code type')
        .sort({ riskScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    return {
      items: items.map((i) => i.toJSON()),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getProjectById(id: string) {
    const project = await Project.findById(id).populate('organizationId', 'name code type state district');
    if (!project) {
      throw new NotFoundError(`Project with ID '${id}' was not found.`);
    }
    return project.toJSON();
  }

  public static async updateProject(
    id: string,
    update: any,
    updater?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    if (update.code) {
      update.code = update.code.toUpperCase();
      const existing = await Project.findOne({ code: update.code, _id: { $ne: id } });
      if (existing) {
        throw new ConflictError(`Project with code '${update.code}' already exists.`);
      }
    }

    if (update.organizationId) {
      const org = await Organization.findById(update.organizationId);
      if (!org) {
        throw new ValidationError(`Referenced organization with ID '${update.organizationId}' does not exist.`);
      }
    }

    const project = await Project.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!project) {
      throw new NotFoundError(`Project with ID '${id}' was not found.`);
    }

    if (updater) {
      await recordAudit({
        actorId: updater.id,
        actorEmail: updater.email,
        actorRole: updater.role,
        action: AuditAction.CONFIG_MODIFIED,
        resource: 'Project',
        resourceId: id,
        ipAddress,
        userAgent,
        requestId,
        details: { updatedFields: Object.keys(update) },
      });
    }

    return project.toJSON();
  }

  /**
   * Geospatial proximity search using MongoDB 2dsphere index
   */
  public static async getNearbyProjects(
    longitude: number,
    latitude: number,
    maxDistanceMeters: number = 50000,
    limit: number = 20,
  ) {
    const projects = await Project.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    })
      .populate('organizationId', 'name code type')
      .limit(limit);

    return projects.map((p) => p.toJSON());
  }

  /**
   * Summary overview statistics for Dashboard KPIs
   */
  public static async getProjectStats() {
    const [total, active, highRisk, flagged, stateBreakdown] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: ProjectStatus.ACTIVE }),
      Project.countDocuments({ riskLevel: { $in: [RiskLevel.HIGH, RiskLevel.CRITICAL] } }),
      Project.countDocuments({ status: ProjectStatus.FLAGGED }),
      Project.aggregate([
        { $group: { _id: '$state', count: { $sum: 1 }, highRiskCount: { $sum: { $cond: [{ $in: ['$riskLevel', ['HIGH', 'CRITICAL']] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      total,
      active,
      highRisk,
      flagged,
      statesCount: stateBreakdown.length,
      stateBreakdown,
    };
  }
}
