import mongoose, { Schema, Model } from 'mongoose';
import { ICategory } from '../types';

export interface CategoryModel extends Model<ICategory> {
  getActive(): Promise<ICategory[]>;
  getByNameEn(nameEn: string): Promise<ICategory | null>;
  getWithSubCategories(): Promise<ICategory[]>;
}

const CategorySchema = new Schema<ICategory, CategoryModel>({
  name: {
    type: String,
    required: [true, 'שם הקטגוריה נדרש'],
    trim: true,
    maxlength: [50, 'שם הקטגוריה לא יכול להיות יותר מ-50 תווים']
},
nameEn: {
    type: String,
    required: [true, 'שם באנגלית נדרש'],
    trim: true,
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'שם באנגלית יכול להכיל רק אותיות קטנות, מספרים ומקפים'],
    maxlength: [50, 'שם הקטגוריה לא יכול להיות יותר מ-50 תווים']
  },
  icon: {
    type: String,
    required: [true, 'אייקון נדרש'],
    trim: true
  },
  color: {
    type: String,
    required: [true, 'צבע נדרש'],
    match: [/^#[0-9A-F]{6}$/i, 'צבע חייב להיות בפורמט HEX']
  },
  sortOrder: {
    type: Number,
    required: true,
    min: [1, 'סדר מיון חייב להיות לפחות 1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  idFromApi: {
    type: String,
    trim: true,
    unique: true,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ isActive: 1, sortOrder: 1 });

CategorySchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

CategorySchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

CategorySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

CategorySchema.statics.getByNameEn = function(nameEn: string) {
  return this.findOne({ nameEn, isActive: true });
};

CategorySchema.statics.getWithSubCategories = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $sort: { sortOrder: 1 } },
    {
      $lookup: {
        from: 'subcategories',
        localField: '_id',
        foreignField: 'categoryId',
        as: 'subCategories',
        pipeline: [
          { $match: { isActive: true } },
          { $sort: { sortOrder: 1 } }
        ]
      }
    }
  ]);
};

export const Category = mongoose.model<ICategory, CategoryModel>('Category', CategorySchema);