import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IIdempotencyKeyDocument extends Document {
  key: string;
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  requestHash: string;
  responseStatusCode: number;
  responseBody: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}

const idempotencyKeySchema = new Schema<IIdempotencyKeyDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestHash: {
      type: String,
      required: true,
    },
    responseStatusCode: {
      type: Number,
      required: true,
    },
    responseBody: {
      type: Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
  },
);

// TTL index to automatically purge idempotency records after 48 hours
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey: Model<IIdempotencyKeyDocument> =
  mongoose.models.IdempotencyKey ||
  mongoose.model<IIdempotencyKeyDocument>('IdempotencyKey', idempotencyKeySchema);
