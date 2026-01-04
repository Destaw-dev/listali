import mongoose, { Schema, Model } from "mongoose";
import {
  IProduct,
  ProductUnit,
} from "../types";

const NUTRITIONAL: string[] = [
  "energy",
  "fat",
  "saturatedFat",
  "transFat",
  "cholesterol",
  "sodium",
  "carbs",
  "sugars",
  "sugarSpoons",
  "polyols",
  "fibers",
  "protein",
  "unknown",
  "carbohydrates",
  "fiber"
];

export interface ProductModel extends Model<IProduct, ProductModel> {
  getKosherProducts(page?: number, limit?: number): Promise<[IProduct[], number]>;
  getOrganicProducts(page?: number, limit?: number): Promise<[IProduct[], number]>;
  getGlutenFreeProducts(page?: number, limit?: number): Promise<[IProduct[], number]>;
  searchByNameHebrew(searchTerm: string, page?: number, limit?: number): Promise<[IProduct[], number]>;
  getByPriceRange(minPrice: number, maxPrice: number, page?: number, limit?: number): Promise<[IProduct[], number]>;
}

const ProductSchema = new Schema<IProduct>(
  {
    alcoholPercentageInProduct: {
      type: String,
    },
    allergenTypeCode: {
      type: [Schema.Types.ObjectId],
      ref: "Allergen",
    },
    allergenTypeCodeMayContain: {
      type: [Schema.Types.ObjectId],
      ref: "Allergen",
    },
    nutritionalValues: {
      type: [
        {
          key: {
            type: String,
            enum: NUTRITIONAL,
          },
          label: String,
          value: Number,
          unit: String,
          per: String,
          originalCode: String,
        },
      ],
    },
    countryOfOrigin: {
      type: String,
    },
    hazardPrecautionaryStatement: {
      type: String,
    },
    ingredientSequence: {
      type: String,
    },
    foodSymbolRed: {
      type: [{
        code: String,
        description: String,
      }],
    },
    forbiddenUnder18: {
      type: Boolean,
    },
    name: {
      type: String,
      required: [true, "שם המוצר נדרש"],
      trim: true,
      maxlength: [100, "שם המוצר לא יכול להיות יותר מ-100 תווים"],
      index: "text",
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "מזהה קטגוריה נדרש"],
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "מזהה תת-קטגוריה נדרש"],
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    defaultUnit: {
      type: String,
      required: [true, "יחידת מידה נדרשת"],
      enum: {
        values: Object.values(ProductUnit),
        message: "יחידת מידה לא תקינה",
      },
    },
    units: {
      type: [String],
      required: [true, "יחידת מידה נדרשת"],
      enum: {
        values: Object.values(ProductUnit),
        message: "יחידת מידה לא תקינה",
      },
    },
    image: {
      primary: { type: String, enum: ["cloudinary", "imagekit"], default: "cloudinary" },
      providers: {
        cloudinary: {
          url: { type: String, trim: true },
          publicId: { type: String, trim: true },
        },
        imagekit: {
          url: { type: String, trim: true },
          fileId: { type: String, trim: true },
          path: { type: String, trim: true },
        },
      },
      meta: {
        width: Number,
        height: Number,
        format: String,
        bytes: Number,
      },
      source: {
        original: { type: String, trim: true },
        small: { type: String, trim: true },
        transparent: { type: String, trim: true },
      },      
      status: {
        type: String,
        enum: ["missing", "uploaded", "partial", "failed"],
        default: "missing",
      },
    },    
    averagePrice: {
      type: Number,
      min: [0, "מחיר לא יכול להיות שלילי"],
    },
    price: {
      type: Number,
      min: [0, "מחיר לא יכול להיות שלילי"],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, "שם הספק לא יכול להיות יותר מ-50 תווים"],
    },
    kosherType: {
      type: String,
      enum: ["חלבי", "פרווה", "בשרי", "לא כשר", "לא רלוונטי"],
      default: "לא רלוונטי",
    },
    kashruts: {
      type: [Schema.Types.ObjectId],
      ref: "Kashrut",
    },
    kosher: {
      type: Boolean,
      default: false,
    },
    glutenFree: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    idFromApi: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Israeli market specifics
ProductSchema.index({ name: "text", tags: "text" });
ProductSchema.index({ categoryId: 1, subCategoryId: 1 });
ProductSchema.index({ kosher: 1 });
ProductSchema.index({ organic: 1 });
ProductSchema.index({ glutenFree: 1 });
ProductSchema.index({ isActive: 1, averagePrice: 1 });

// Virtual Fields
// ProductSchema.virtual("category", {
//   ref: "Category",
//   localField: "categoryId",
//   foreignField: "_id",
//   justOne: true,
// });

// ProductSchema.virtual("subCategory", {
//   ref: "SubCategory",
//   localField: "subCategoryId",
//   foreignField: "_id",
//   justOne: true,
// });

// Instance Methods
ProductSchema.methods.markAsKosher = function () {
  this.kosher = true;
  if (!this.tags.includes("כשר")) {
    this.tags.push("כשר");
  }
  return this.save();
};

ProductSchema.methods.markAsOrganic = function () {
  this.organic = true;
  if (!this.tags.includes("אורגני")) {
    this.tags.push("אורגני");
  }
  return this.save();
};

ProductSchema.methods.markAsGlutenFree = function () {
  this.glutenFree = true;
  if (!this.tags.includes("ללא גלוטן")) {
    this.tags.push("ללא גלוטן");
  }
  return this.save();
};

ProductSchema.statics.getKosherProducts = function (
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const query = { kosher: true, isActive: true };

  return Promise.all([this.find(query)
    .populate("categoryId subCategoryId")
    .sort({ name: 1 })
    .skip(skip).lean()
    .limit(limit), this.countDocuments(query)])
};

ProductSchema.statics.getOrganicProducts = function (
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const query = { organic: true, isActive: true };
  return Promise.all([this.find(query)
    .populate("categoryId subCategoryId")
    .sort({ name: 1 })
    .skip(skip).lean()
    .limit(limit), this.countDocuments(query)])
};

ProductSchema.statics.getGlutenFreeProducts = function (
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const query = { glutenFree: true, isActive: true };
  return Promise.all([this.find(query)
    .populate("categoryId subCategoryId")
    .sort({ name: 1 })
    .skip(skip).lean()
    .limit(limit), this.countDocuments(query)])
};

ProductSchema.statics.searchByNameHebrew = function (
  searchTerm: string,
  page: number,
  limit: number
) {
  return Promise.all([
    this.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { tags: { $in: [new RegExp(searchTerm, "i")] } },
      ],
      isActive: true,
    })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .populate("categoryId subCategoryId"),

    this.countDocuments({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { tags: { $in: [new RegExp(searchTerm, "i")] } },
      ],
      isActive: true,
    }),
  ]);
};


ProductSchema.statics.getByPriceRange = function (
  minPrice: number,
  maxPrice: number,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const query = {
    averagePrice: { $gte: minPrice, $lte: maxPrice },
    isActive: true,
  };
  return Promise.all([this.find(query)
    .populate("categoryId subCategoryId")
    .sort({ averagePrice: 1 })
    .skip(skip).lean()
    .limit(limit), this.countDocuments(query)])
};


const Product = mongoose.model<IProduct, ProductModel>(
  "Product",
  ProductSchema
);

export default Product;
