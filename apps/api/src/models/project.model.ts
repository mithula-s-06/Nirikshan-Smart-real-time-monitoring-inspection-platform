import mongoose, { Document, Schema, Model } from 'mongoose';
import { ProjectStatus, RiskLevel, IProject } from '@nirikshan/shared-types';

export interface IProjectDocument extends Omit<IProject, 'id'>, Document {}

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function (coords: number[]) {
          return (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 && // longitude
            coords[1] >= -90 &&
            coords[1] <= 90 // latitude
          );
        },
        message: 'Coordinates must be valid [longitude, latitude] between -180..180 and -90..90.',
      },
    },
  },
  { _id: false },
);

const projectSchema = new Schema<IProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Project code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    scheme: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
    },
    geofenceRadiusMeters: {
      type: Number,
      default: 200,
      min: 10,
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.ACTIVE,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      default: RiskLevel.LOW,
      index: true,
    },
    riskScore: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
      index: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    lastInspectedAt: {
      type: Date,
      index: true,
    },
    nextEligibleInspectionAt: {
      type: Date,
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

// MongoDB 2dsphere geospatial index for spatial queries ($near, $geoWithin, etc.)
projectSchema.index({ location: '2dsphere' });

// Compound indexes for administrative filters
projectSchema.index({ state: 1, district: 1, status: 1 });
projectSchema.index({ riskLevel: 1, riskScore: -1 });
projectSchema.index({ scheme: 1, status: 1 });

export const Project: Model<IProjectDocument> =
  mongoose.models.Project || mongoose.model<IProjectDocument>('Project', projectSchema);
