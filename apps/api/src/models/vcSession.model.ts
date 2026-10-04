import mongoose, { Document, Schema, Model } from 'mongoose';
import { IVCSession, VCSessionStatus } from '@nirikshan/shared-types';

export interface IVCSessionDocument extends Omit<IVCSession, 'id'>, Document {}

const observationSchema = new Schema(
  {
    question: { type: String, required: true },
    response: { type: String, required: true },
    isSatisfactory: { type: Boolean, default: true },
  },
  { _id: false },
);

const vcSessionSchema = new Schema<IVCSessionDocument>(
  {
    sessionCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      required: true,
      index: true,
    },
    initiatedByOfficerId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
    },
    projectInchargeName: {
      type: String,
      required: true,
    },
    inchargePhone: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(VCSessionStatus),
      default: VCSessionStatus.INITIATED,
      index: true,
    },
    isSurprise: {
      type: Boolean,
      default: true,
    },
    scheduledTime: { type: Date },
    connectedTime: { type: Date },
    endedTime: { type: Date },
    reportedStaffCount: { type: Number, default: 0 },
    verifiedStaffCount: { type: Number, default: 0 },
    reportedBeneficiaryCount: { type: Number, default: 0 },
    verifiedBeneficiaryCount: { type: Number, default: 0 },
    observations: [observationSchema],
    notes: { type: String, default: '' },
    anomalyFlagged: { type: Boolean, default: false },
    recordingUrl: { type: String },
    isIntegrationReady: { type: Boolean, default: true },
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

vcSessionSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export const VCSession: Model<IVCSessionDocument> =
  mongoose.models.VCSession ||
  mongoose.model<IVCSessionDocument>('VCSession', vcSessionSchema);
