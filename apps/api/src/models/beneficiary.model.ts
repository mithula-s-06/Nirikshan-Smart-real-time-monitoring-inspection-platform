import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  IBeneficiary,
  BeneficiaryEligibility,
  BeneficiaryVerificationStatus,
  RiskLevel,
} from '@nirikshan/shared-types';

export interface IBeneficiaryDocument extends Omit<IBeneficiary, 'id'>, Document {}

const beneficiarySchema = new Schema<IBeneficiaryDocument>(
  {
    beneficiaryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Beneficiary name is required'],
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },
    guardianName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true,
    },
    category: {
      type: String,
      enum: ['SC', 'ST', 'OBC', 'EWS', 'GENERAL', 'PWD'],
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      index: true,
    },
    maskedPhone: {
      type: String,
      required: true,
    },
    phoneHash: {
      type: String,
      required: true,
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
    unitId: {
      type: String,
      index: true,
    },
    scheme: {
      type: String,
      required: true,
      index: true,
    },
    enrollmentStartDate: {
      type: String,
      required: true,
    },
    enrollmentEndDate: {
      type: String,
    },
    eligibilityStatus: {
      type: String,
      enum: Object.values(BeneficiaryEligibility),
      default: BeneficiaryEligibility.ELIGIBLE,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(BeneficiaryVerificationStatus),
      default: BeneficiaryVerificationStatus.VERIFIED,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      default: RiskLevel.LOW,
      index: true,
    },
    totalAttendanceSessions: {
      type: Number,
      default: 0,
    },
    verifiedAttendanceSessions: {
      type: Number,
      default: 0,
    },
    activeAnomaliesCount: {
      type: Number,
      default: 0,
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

beneficiarySchema.index({ projectId: 1, unitId: 1, eligibilityStatus: 1 });
beneficiarySchema.index({ state: 1, district: 1, scheme: 1 });

export const Beneficiary: Model<IBeneficiaryDocument> =
  mongoose.models.Beneficiary ||
  mongoose.model<IBeneficiaryDocument>('Beneficiary', beneficiarySchema);
