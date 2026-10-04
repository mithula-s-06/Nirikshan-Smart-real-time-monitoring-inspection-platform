import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  ICorrectiveAction,
  CorrectiveActionStatus,
  CorrectiveActionPriority,
} from '@nirikshan/shared-types';

export interface ICorrectiveActionDocument extends Omit<ICorrectiveAction, 'id'>, Document {}

const correctiveActionSchema = new Schema<ICorrectiveActionDocument>(
  {
    actionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Action title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    responsibleAuthority: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Organization',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Project',
      index: true,
    },
    inspectionId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Inspection',
      index: true,
    },
    anomalyId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AnomalyAlert',
      index: true,
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(CorrectiveActionPriority),
      default: CorrectiveActionPriority.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CorrectiveActionStatus),
      default: CorrectiveActionStatus.OPEN,
      index: true,
    },
    evidenceRequired: {
      type: String,
      required: true,
    },
    submittedEvidenceIds: [{ type: String }],
    officerRemarks: {
      type: String,
    },
    assignedOfficerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

correctiveActionSchema.index({ organizationId: 1, status: 1, deadline: 1 });

export const CorrectiveAction: Model<ICorrectiveActionDocument> =
  mongoose.models.CorrectiveAction ||
  mongoose.model<ICorrectiveActionDocument>('CorrectiveAction', correctiveActionSchema);
