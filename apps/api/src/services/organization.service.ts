import { OrganizationType, AuditAction, UserRole } from '@nirikshan/shared-types';
import { Organization, IOrganizationDocument } from '../models/organization.model';
import { NotFoundError, ConflictError } from '../utils/errors';
import { recordAudit } from './audit.service';

export interface GetOrganizationsQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: OrganizationType;
  state?: string;
  district?: string;
  isActive?: boolean;
}

export class OrganizationService {
  public static async createOrganization(
    input: any,
    creator?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const existing = await Organization.findOne({ code: input.code.toUpperCase() });
    if (existing) {
      throw new ConflictError(`Organization with code '${input.code}' already exists.`);
    }

    const org = await Organization.create({
      ...input,
      code: input.code.toUpperCase(),
    });

    if (creator) {
      await recordAudit({
        actorId: creator.id,
        actorEmail: creator.email,
        actorRole: creator.role,
        action: AuditAction.CONFIG_MODIFIED,
        resource: 'Organization',
        resourceId: org._id.toString(),
        ipAddress,
        userAgent,
        requestId,
        details: { name: org.name, code: org.code, type: org.type },
      });
    }

    return org.toJSON();
  }

  public static async getOrganizations(query: GetOrganizationsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.type) {
      filter.type = query.type;
    }
    if (query.state) {
      filter.state = new RegExp(query.state, 'i');
    }
    if (query.district) {
      filter.district = new RegExp(query.district, 'i');
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [{ name: searchRegex }, { code: searchRegex }, { contactEmail: searchRegex }];
    }

    const [items, total] = await Promise.all([
      Organization.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Organization.countDocuments(filter),
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

  public static async getOrganizationById(id: string) {
    const org = await Organization.findById(id);
    if (!org) {
      throw new NotFoundError(`Organization with ID '${id}' not found.`);
    }
    return org.toJSON();
  }

  public static async updateOrganization(
    id: string,
    update: any,
    updater?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    if (update.code) {
      update.code = update.code.toUpperCase();
      const existing = await Organization.findOne({ code: update.code, _id: { $ne: id } });
      if (existing) {
        throw new ConflictError(`Organization with code '${update.code}' already exists.`);
      }
    }

    const org = await Organization.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!org) {
      throw new NotFoundError(`Organization with ID '${id}' not found.`);
    }

    if (updater) {
      await recordAudit({
        actorId: updater.id,
        actorEmail: updater.email,
        actorRole: updater.role,
        action: AuditAction.CONFIG_MODIFIED,
        resource: 'Organization',
        resourceId: id,
        ipAddress,
        userAgent,
        requestId,
        details: { updatedFields: Object.keys(update) },
      });
    }

    return org.toJSON();
  }
}
