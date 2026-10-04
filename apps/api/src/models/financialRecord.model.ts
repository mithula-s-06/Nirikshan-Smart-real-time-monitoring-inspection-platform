import mongoose, { Document, Schema, Model } from 'mongoose';
import { IFinancialRecord } from '@nirikshan/shared-types';

export interface IFinancialRecordDocument extends Omit<IFinancialRecord, 'id'>, Document {}

const budgetHeadSchema = new Schema(
  {
    name: { type: String, required: true },
    sanctionedAmount: { type: Number, required: true },
    utilizedAmount: { type: Number, required: true },
    headLimit: { type: Number, required: true },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    id: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    vendorName: { type: String, required: true },
    vendorGstin: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    documentHash: { type: String, required: true },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },
  },
  { _id: false },
);

const financialRecordSchema = new Schema<IFinancialRecordDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Project',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Organization',
      index: true,
    },
    financialYear: {
      type: String,
      required: true,
      index: true,
    },
    totalSanctionedGrant: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDisbursedFunds: {
      type: Number,
      required: true,
      default: 0,
    },
    totalExpenditure: {
      type: Number,
      required: true,
      default: 0,
    },
    openingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    closingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    verifiedPhysicalProgressPercent: {
      type: Number,
      required: true,
      default: 0,
    },
    financialBurnPercent: {
      type: Number,
      required: true,
      default: 0,
    },
    budgetHeads: [budgetHeadSchema],
    invoices: [invoiceSchema],
    riskScore: {
      type: Number,
      default: 0,
      index: true,
    },
    anomaliesDetected: [{ type: String }],
    lastAuditedAt: {
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

financialRecordSchema.index({ projectId: 1, financialYear: 1 }, { unique: true });

export const FinancialRecord: Model<IFinancialRecordDocument> =
  mongoose.models.FinancialRecord ||
  mongoose.model<IFinancialRecordDocument>('FinancialRecord', financialRecordSchema);
