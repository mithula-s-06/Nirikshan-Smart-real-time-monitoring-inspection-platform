import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  IAnomalyAlert,
  AnomalyType,
  AnomalySeverity,
  AlertStatus,
} from '@nirikshan/shared-types';

export interface IAnomalyAlertDocument extends Omit<IAnomalyAlert, 'id' | 'projectId' | 'inspectionId' | 'assignedOfficerId'>, Document {
  projectId: Schema.Types.ObjectId | string;
  inspectionId?: Schema.Types.ObjectId | string;
  assignedOfficerId?: Schema.Types.ObjectId | string;
}

const AnomalyAlertSchema = new Schema<IAnomalyAlertDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AnomalyType),
      required: [true, 'Anomaly type is required'],
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(AnomalySeverity),
      required: [true, 'Anomaly severity is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AlertStatus),
      default: AlertStatus.OPEN,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.85,
    },
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Explainable rationale is required'],
      trim: true,
    },
    source: {
      type: String,
      enum: ['AI_SERVICE', 'RULE_ENGINE', 'MANUAL_FLAG'],
      default: 'AI_SERVICE',
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },
    assignedOfficerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: null,
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

AnomalyAlertSchema.index({ status: 1, severity: 1, createdAt: -1 });

export const AnomalyAlert: Model<IAnomalyAlertDocument> =
  mongoose.models.AnomalyAlert ||
  mongoose.model<IAnomalyAlertDocument>('AnomalyAlert', AnomalyAlertSchema);
