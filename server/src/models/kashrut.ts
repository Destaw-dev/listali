import mongoose, { Schema, Document } from 'mongoose';

export interface IKashrut extends Document {
  KashrutId: number;
  name: string;
  is_leading: 0 | 1;
  media_url?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const KashrutSchema = new Schema<IKashrut>(
  {
    KashrutId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    is_leading: { type: Number, enum: [0, 1], required: true },
    media_url: { type: String, default: null },
  },
  { timestamps: true }
);

export const KashrutModel = mongoose.model<IKashrut>('Kashrut', KashrutSchema);
