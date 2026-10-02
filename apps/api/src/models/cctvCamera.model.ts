import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ICCTVCamera,
  CameraStatus,
  StreamProtocol,
} from '@nirikshan/shared-types';

export interface ICCTVCameraDocument extends Omit<ICCTVCamera, 'id' | 'projectId'>, Document {
  projectId: Schema.Types.ObjectId | string;
  location?: { type: string; coordinates: [number, number] };
  rawStreamUrl?: string;
  cpuUsagePct?: number;
  memoryUsagePct?: number;
}

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false },
);

const CCTVCameraSchema = new Schema<ICCTVCameraDocument>(
  {
    name: {
      type: String,
      required: [true, 'Camera name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Camera unique code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    locationDescription: {
      type: String,
      required: [true, 'Location description is required'],
      trim: true,
    },
    location: {
      type: geoPointSchema,
      default: undefined,
    },
    status: {
      type: String,
      enum: Object.values(CameraStatus),
      default: CameraStatus.OFFLINE,
      index: true,
    },
    protocol: {
      type: String,
      enum: Object.values(StreamProtocol),
      default: StreamProtocol.HLS,
      index: true,
    },
    rawStreamUrl: {
      type: String,
      trim: true,
      default: null,
    },
    streamPath: {
      type: String,
      trim: true,
      default: '',
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    lastHeartbeatAt: {
      type: Date,
      default: null,
      index: true,
    },
    resolution: {
      type: String,
      default: '1080p',
    },
    fps: {
      type: Number,
      default: 30,
    },
    cpuUsagePct: {
      type: Number,
      default: null,
    },
    memoryUsagePct: {
      type: Number,
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
        delete ret.rawStreamUrl; // Never leak internal camera credentials in public payload
        return ret;
      },
    },
  },
);

CCTVCameraSchema.index({ projectId: 1, status: 1 });

export const CCTVCamera: Model<ICCTVCameraDocument> =
  mongoose.models.CCTVCamera ||
  mongoose.model<ICCTVCameraDocument>('CCTVCamera', CCTVCameraSchema);

export const CctvCamera = CCTVCamera;
