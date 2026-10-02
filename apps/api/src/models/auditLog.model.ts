import mongoose, { Document, Schema, Model } from 'mongoose';
import { AuditAction, UserRole, IAuditLog } from '@nirikshan/shared-types';

export interface IAuditLogDocument extends Omit<IAuditLog, 'id'>, Document {}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorEmail: {
      type: String,
      index: true,
    },
    actorRole: {
      type: String,
      enum: Object.values(UserRole),
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    requestId: {
      type: String,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

// Compound indexes for audit lookups
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);
