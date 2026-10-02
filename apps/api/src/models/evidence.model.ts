import mongoose, { Document, Schema, Model } from 'mongoose';
import { EvidenceType, IEvidence, IGeoPoint } from '@nirikshan/shared-types';

export interface IEvidenceDocument extends Omit<IEvidence, 'id' | 'location'>, Document {
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

const evidenceSchema = new Schema<IEvidenceDocument>(
  {
    inspectionId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Inspection',
      required: [true, 'Inspection ID is required'],
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Project',
      index: true,
    },
    capturedBy: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'Capturing User ID is required'],
      index: true,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(EvidenceType),
      default: EvidenceType.PHOTO,
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileKey: {
      type: String,
      required: [true, 'Internal file key is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    sha256Hash: {
      type: String,
      required: [true, 'SHA-256 cryptographic hash is required for evidentiary integrity'],
      index: true,
    },
    isHashVerified: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    locationAccuracyMeters: {
      type: Number,
    },
    isLocationVerified: {
      type: Boolean,
      default: false,
    },
    distanceFromProjectMeters: {
      type: Number,
    },
    checklistQuestionId: {
      type: String,
      index: true,
    },
    deviceMetadata: {
      platform: { type: String },
      model: { type: String },
      osVersion: { type: String },
      appVersion: { type: String },
      capturedTimestamp: { type: Date },
    },
    tags: [{ type: String }],
    description: {
      type: String,
      default: '',
    },
    aiAnalysis: {
      analyzed: { type: Boolean, default: false },
      anomalyDetected: { type: Boolean, default: false },
      labels: [{ type: String }],
      confidence: { type: Number },
      notes: { type: String },
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

// Indexes
evidenceSchema.index({ inspectionId: 1, type: 1 });
evidenceSchema.index({ projectId: 1, capturedAt: -1 });
evidenceSchema.index({ location: '2dsphere' });

export const Evidence: Model<IEvidenceDocument> =
  mongoose.models.Evidence || mongoose.model<IEvidenceDocument>('Evidence', evidenceSchema);
