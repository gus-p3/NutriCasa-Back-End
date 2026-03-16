// models/RefreshToken.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  userId:    Types.ObjectId;
  tokenHash: string;          // SHA-256 hash of the actual token (never store plain)
  expiresAt: Date;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date,   required: true, index: { expireAfterSeconds: 0 } }, // TTL index — MongoDB auto-deletes expired docs
  },
  { timestamps: true }
);

export default model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
