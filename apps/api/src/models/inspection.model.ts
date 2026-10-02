import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  InspectionType,
  InspectionPriority,
  InspectionStatus,
  ChecklistItemType,
  IInspection,
  IInspectionLocationLog,
  IChecklistItemAnswer,
} from '@nirikshan/shared-types';

export interface IInspectionDocument extends Omit<IInspection, 'id'>, Document {
  auditHistory: Array<{
    stage: string;
    timestamp: Date;
    actorId?: string;
    comment?: string;
  }>;
}

const locationLogSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    accuracyMeters: { type: Number },
    distanceFromProjectMeters: { type: Number, required: true },
    isVerified: { type: Boolean, required: true },
    stage: { type: String, enum: ['ACCEPT', 'EN_ROUTE', 'ARRIVE', 'START', 'SUBMIT'], required: true },
  },
  { _id: false },
);

const checklistResponseSchema = new Schema(
  {
    itemId: { type: String, required: true },
    category: { type: String, required: true },
    question: { type: String, required: true },
    type: { type: String, enum: Object.values(ChecklistItemType), required: true },
    value: { type: Schema.Types.Mixed, default: null },
    comment: { type: String },
    photoEvidenceIds: [{ type: String }],
    isCompliant: { type: Boolean, default: true },
  },
  { _id: false },
);

const auditHistorySchema = new Schema(
  {
    stage: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actorId: { type: String },
    comment: { type: String },
  },
  { _id: false },
);

const inspectionSchema = new Schema<IInspectionDocument>(
  {
    inspectionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Project',
      required: true,
      index: true,
    },
    inspectorId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(InspectionType),
      default: InspectionType.ROUTINE,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(InspectionStatus),
      default: InspectionStatus.ASSIGNED,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(InspectionPriority),
      default: InspectionPriority.MEDIUM,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    acceptedAt: { type: Date },
    enRouteAt: { type: Date },
    arrivedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId as any, ref: 'User' },
    reviewNotes: { type: String },
    actionRequiredDetails: { type: String },
    locationLogs: [locationLogSchema],
    isLocationVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    checklistResponses: [checklistResponseSchema],
    observations: { type: String },
    recommendations: { type: String },
    anomalyDetected: { type: Boolean, default: false },
    score: { type: Number, min: 0, max: 100 },
    evidenceIds: [{ type: String }],
    assignmentReason: { type: String },
    auditHistory: [auditHistorySchema],
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

// Compound indexes for fast multi-dimensional queries
inspectionSchema.index({ projectId: 1, status: 1 });
inspectionSchema.index({ inspectorId: 1, status: 1 });
inspectionSchema.index({ status: 1, priority: 1, assignedAt: -1 });

export const Inspection: Model<IInspectionDocument> =
  mongoose.models.Inspection || mongoose.model<IInspectionDocument>('Inspection', inspectionSchema);
