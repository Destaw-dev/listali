import mongoose, { Schema, Document } from 'mongoose';

export interface IKashrut extends Document {
  name: string;
  is_leading: 0 | 1;
  media_url?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  idFromApi: string;
}

const KashrutSchema = new Schema<IKashrut>(
  {
    name: { type: String, required: true },
    is_leading: { type: Number, enum: [0, 1], required: true },
    media_url: { type: String, default: null },
    idFromApi: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

export const KashrutModel = mongoose.model<IKashrut>('Kashrut', KashrutSchema);
