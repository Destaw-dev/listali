import mongoose, { Schema, Model } from 'mongoose';
import { ISubCategory } from '../types';

export interface SubCategoryModel extends Model<ISubCategory> {
  getByCategory(categoryId: mongoose.Types.ObjectId): Promise<ISubCategory[]>;
  getWithProducts(categoryId?: mongoose.Types.ObjectId): Promise<ISubCategory[] | null>;
}

const SubCategorySchema = new Schema<ISubCategory, SubCategoryModel>({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'מזהה קטגוריה נדרש']
  },
  name: {
    type: String,
    required: [true, 'שם תת-הקטגוריה נדרש'],
    trim: true,
    maxlength: [50, 'שם תת-הקטגוריה לא יכול להיות יותר מ-50 תווים']
},
nameEn: {
    type: String,
    required: [true, 'שם באנגלית נדרש'],
    trim: true,
    lowercase: true,
    maxlength: [50, 'שם תת-הקטגוריה לא יכול להיות יותר מ-50 תווים'],
    match: [/^[a-z0-9-]+$/, 'שם באנגלית יכול להכיל רק אותיות קטנות, מספרים ומקפים']
  },
  icon: {
    type: String,
    required: [true, 'אייקון נדרש'],
    trim: true
  },
  sortOrder: {
    type: Number,
    required: true,
    min: [1, 'סדר מיון חייב להיות לפחות 1']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SubCategorySchema.index({ categoryId: 1, sortOrder: 1 });
SubCategorySchema.index({ isActive: 1 });

// Virtual Fields
SubCategorySchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Instance Methods
SubCategorySchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

SubCategorySchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

// Static Methods
SubCategorySchema.statics.getByCategory = function(categoryId: mongoose.Types.ObjectId) {
  return this.find({ categoryId, isActive: true }).sort({ sortOrder: 1 });
};

SubCategorySchema.statics.getByCategoryWithPopulate = function(categoryId: mongoose.Types.ObjectId) {
  return this.find({ categoryId, isActive: true })
    .populate('category')
    .sort({ sortOrder: 1 });
};

SubCategorySchema.statics.getWithProducts = function(categoryId?: mongoose.Types.ObjectId) {
  const matchStage = categoryId 
    ? { categoryId, isActive: true }
    : { isActive: true };

  return this.aggregate([
    { $match: matchStage },
    { $sort: { sortOrder: 1 } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'subCategoryId',
        as: 'products',
        pipeline: [
          { $match: { isActive: true } },
          { $sort: { name: 1 } }
        ]
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
        pipeline: [{ $limit: 1 }]
      }
    },
    {
      $unwind: '$category'
    }
  ]);
};

export const SubCategory = mongoose.model<ISubCategory, SubCategoryModel>('SubCategory', SubCategorySchema);