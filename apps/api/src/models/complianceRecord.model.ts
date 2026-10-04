import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  IComplianceRecord,
  ComplianceActionType,
  ComplianceVerificationStatus,
  ComplianceCurrentStatus,
} from '@nirikshan/shared-types';

export interface IComplianceRecordDocument extends Omit<IComplianceRecord, 'id'>, Document {}

const complianceRecordSchema = new Schema<IComplianceRecordDocument>(
  {
    ngoName: {
      type: String,
      required: [true, 'NGO/Institution name is required'],
      trim: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      trim: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: Object.values(ComplianceActionType),
      required: true,
      index: true,
    },
    actionDate: {
      type: String,
      trim: true,
    },
    scheme: {
      type: String,
      trim: true,
    },
    authority: {
      type: String,
      required: true,
      trim: true,
      default: 'Ministry of Social Justice & Empowerment, Govt. of India',
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    sourceDocument: {
      type: String,
      required: true,
      default: 'Official Ministry Blacklist Notification & Audit Log',
    },
    verificationStatus: {
      type: String,
      enum: Object.values(ComplianceVerificationStatus),
      default: ComplianceVerificationStatus.VERIFIED,
      index: true,
    },
    currentStatus: {
      type: String,
      enum: Object.values(ComplianceCurrentStatus),
      default: ComplianceCurrentStatus.BLACKLISTED,
      index: true,
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

complianceRecordSchema.index({ ngoName: 'text', description: 'text', state: 1 });

export const ComplianceRecord: Model<IComplianceRecordDocument> =
  mongoose.models.ComplianceRecord ||
  mongoose.model<IComplianceRecordDocument>('ComplianceRecord', complianceRecordSchema);
