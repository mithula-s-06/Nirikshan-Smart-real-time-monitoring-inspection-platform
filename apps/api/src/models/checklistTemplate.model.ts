import mongoose, { Document, Schema, Model } from 'mongoose';
import { ChecklistItemType } from '@nirikshan/shared-types';

export interface IChecklistQuestion {
  id: string;
  question: string;
  type: ChecklistItemType;
  isRequired: boolean;
  weight: number;
  helpText?: string;
}

export interface IChecklistCategory {
  categoryName: string;
  questions: IChecklistQuestion[];
}

export interface IChecklistTemplateDocument extends Document {
  name: string;
  code: string;
  scheme?: string;
  categories: IChecklistCategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    type: { type: String, enum: Object.values(ChecklistItemType), required: true },
    isRequired: { type: Boolean, default: true },
    weight: { type: Number, default: 1 },
    helpText: { type: String },
  },
  { _id: false },
);

const categorySchema = new Schema(
  {
    categoryName: { type: String, required: true },
    questions: [questionSchema],
  },
  { _id: false },
);

const checklistTemplateSchema = new Schema<IChecklistTemplateDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    scheme: { type: String, trim: true, index: true },
    categories: [categorySchema],
    isActive: { type: Boolean, default: true, index: true },
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

export const ChecklistTemplate: Model<IChecklistTemplateDocument> =
  mongoose.models.ChecklistTemplate ||
  mongoose.model<IChecklistTemplateDocument>('ChecklistTemplate', checklistTemplateSchema);
