import mongoose, { Schema, Document } from 'mongoose';

export interface IAllergen extends Document {
  allergenId: number;
  name: string;
}

const AllergenSchema = new Schema<IAllergen>({
  allergenId: { type: Number, required: true, unique: true },
  name: { type: String, required: true }
});

export const AllergenModel = mongoose.model<IAllergen>('Allergen', AllergenSchema);