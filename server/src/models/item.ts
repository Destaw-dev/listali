import mongoose, { Schema, Model, FilterQuery, PipelineStage } from 'mongoose';
import { 
  IItem, 
  ItemDocument, 
  ItemCategory, 
  ItemUnit,
  IFindByShoppingListOptions,
  IFindByCategoryOptions,
  IItemQueryOptions,
  ICategoryStats
} from '../types';

type ItemModel = Model<IItem> & {
  findByShoppingList(
    shoppingListId: string,
    options?: {
      status?: string;
      category?: string;
      priority?: string;
      search?: string;
      sort?: string;
    }
  ): Promise<ItemDocument[]>;
  getPopularItemsMostPurchasedByGroup(groupId?: string, limit?: number): Promise<ItemDocument[]>;
  getCategoryStats(shoppingListId?: string): Promise<ICategoryStats[]>;
  searchItems(searchTerm: string, options?: IItemQueryOptions): Promise<ItemDocument[]>;
  findByProduct(productId: string, options?: IItemQueryOptions): Promise<ItemDocument[]>;
  findManualItems(shoppingListId?: string, options?: IItemQueryOptions): Promise<ItemDocument[]>;
  findProductBasedItems(shoppingListId?: string, options?: IItemQueryOptions): Promise<ItemDocument[]>;
};


const UNITS: ItemUnit[] = [
  'piece', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'cup', 'tbsp', 'tsp',
  'package', 'box', 'bag', 'bottle', 'can'
];

const itemSchema = new Schema<IItem, ItemModel>({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    minlength: [1, 'Item name must be at least 1 character'],
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
    max: [10000, 'Quantity cannot exceed 10,000']
  },
  quantityToPurchase: {
    type: Number,
    default: 0,
    min: [0, 'Quantity to purchase cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: UNITS,
    default: 'piece'
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  estimatedPrice: {
    type: Number,
    min: [0, 'Estimated price cannot be negative'],
    max: [10000, 'Estimated price cannot exceed 10,000']
  },
  actualPrice: {
    type: Number,
    min: [0, 'Actual price cannot be negative'],
    max: [10000, 'Actual price cannot exceed 10,000']
  },
  barcode: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^\d{8,14}$/.test(v);
      },
      message: 'Barcode must be 8-14 digits'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'purchased', 'partially_purchased', 'not_available', 'cancelled'],
    default: 'pending'
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Added by user is required']
  },
  purchasedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  purchasedAt: {
    type: Date,
    default: null
  },
  purchasedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Purchased quantity cannot be negative'],
    validate: {
      validator: function(this: IItem, value: number) {
        return value <= this.quantity;
      },
      message: 'Purchased quantity cannot exceed total quantity'
    }
  },
  shoppingList: {
    type: Schema.Types.ObjectId,
    ref: 'ShoppingList',
    required: [true, 'Shopping list is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters']
  },
  alternatives: [{
    type: String,
    trim: true,
    maxlength: [100, 'Alternative cannot exceed 100 characters']
  }],
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  isManualEntry: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


itemSchema.index({ shoppingList: 1, category: 1, status: 1 });
itemSchema.index({ addedBy: 1 });
itemSchema.index({ purchasedBy: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ priority: 1, status: 1 });
itemSchema.index({ barcode: 1 });
itemSchema.index({ status: 1, createdAt: -1 });
itemSchema.index({ name: 'text', description: 'text' });

itemSchema.index({ product: 1 });
itemSchema.index({ isManualEntry: 1 });

itemSchema.virtual('totalEstimatedCost').get(function() {
  return this.estimatedPrice ? this.estimatedPrice * this.quantity : 0;
});

itemSchema.virtual('totalActualCost').get(function() {
  return this.actualPrice ? this.actualPrice * this.quantity : 0;
});

itemSchema.virtual('costDifference').get(function() {
  if (!this.estimatedPrice || !this.actualPrice) return 0;
  return (this.actualPrice - this.estimatedPrice) * this.quantity;
});

itemSchema.virtual('isPurchased').get(function() {
  const purchasedQty = this.purchasedQuantity || 0;
  return purchasedQty >= this.quantity && this.quantity > 0;
});

itemSchema.virtual('isPartiallyPurchased').get(function() {
  const purchasedQty = this.purchasedQuantity || 0;
  return purchasedQty > 0 && purchasedQty < this.quantity;
});

itemSchema.virtual('remainingQuantity').get(function() {
  const purchasedQty = this.purchasedQuantity || 0;
  return Math.max(0, this.quantity - purchasedQty);
});

itemSchema.virtual('displayName').get(function() {
  return this.brand ? `${this.name} (${this.brand})` : this.name;
});

itemSchema.virtual('quantityWithUnit').get(function() {
  return `${this.quantity} ${this.unit}${this.quantity > 1 && this.unit === 'piece' ? 's' : ''}`;
});

itemSchema.virtual('isProductBased').get(function() {
  return !this.isManualEntry && !!this.product;
});

itemSchema.virtual('hasProduct').get(function() {
  return !!this.product;
});

itemSchema.pre('save', function(next) {
  if (this.isModified('purchasedQuantity') || this.isModified('quantity') || this.isModified('quantityToPurchase')) {
    let purchasedQty = this.purchasedQuantity || 0;
    
    if (this.isModified('quantity') && !this.isModified('purchasedQuantity') && purchasedQty > this.quantity) {
      purchasedQty = this.quantity;
      this.purchasedQuantity = purchasedQty;
    }
    
    if (purchasedQty >= this.quantity && this.quantity > 0) {
      this.status = 'purchased';
      if (!this.purchasedAt) {
        this.purchasedAt = new Date();
        this.quantityToPurchase = 0;
      }
    } else if (purchasedQty > 0 && purchasedQty < this.quantity) {
      this.status = 'partially_purchased';
      if (!this.purchasedAt) {
        this.purchasedAt = new Date();
        this.quantityToPurchase = this.quantity - purchasedQty;
      }
    } else {
      this.status = 'pending';
      if (purchasedQty === 0) {
        this.purchasedBy = null;
        this.purchasedAt = null;
        this.quantityToPurchase = this.quantity;
      }
    }
  }
  
  if (this.isModified('status') && (this.status === 'purchased' || this.status === 'partially_purchased') && !this.purchasedAt) {
    this.purchasedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'pending' && this.purchasedQuantity === 0) {
    this.purchasedBy = null;
    this.purchasedAt = null;
  }
  
  if (this.isModified('unit')) {
    this.unit = this.unit.toLowerCase() as ItemUnit;
  }
  
  next();
});

itemSchema.methods.markAsPurchased = async function(
  purchasedBy: string, 
  purchasedQuantity?: number, 
  actualPrice?: number
) {
  const quantityToPurchase = purchasedQuantity !== undefined ? purchasedQuantity : this.quantity;
  
  if (quantityToPurchase < 0 || quantityToPurchase > this.quantity) {
    throw new Error('Purchased quantity must be between 0 and total quantity');
  }
  
  this.purchasedQuantity = quantityToPurchase;
  this.purchasedBy = new mongoose.Types.ObjectId(purchasedBy);
  
  if (quantityToPurchase >= this.quantity) {
    this.status = 'purchased';
    this.purchasedAt = new Date();
  } else if (quantityToPurchase > 0) {
    this.status = 'partially_purchased';
    this.purchasedAt = new Date();
  } else {
    this.status = 'pending';
    this.purchasedBy = null;
    this.purchasedAt = null;
  }
  
  if (actualPrice !== undefined) {
    this.actualPrice = actualPrice;
  }
  
  await this.save();
  
  const ShoppingList = mongoose.model('ShoppingList');
  const shoppingList = await ShoppingList.findById(this.shoppingList);
  if (shoppingList) {
    await shoppingList.updateMetadata();
  }
  
  return this;
};

itemSchema.methods.markAsNotPurchased = async function(quantityToUnpurchase?: number) {
  if (quantityToUnpurchase === undefined) {
    this.purchasedQuantity = 0;
  } else {
    this.purchasedQuantity = this.purchasedQuantity - quantityToUnpurchase;
    if (this.purchasedQuantity < 0) {
      this.purchasedQuantity = 0;
    }
  }

  this.quantityToPurchase = this.quantity - this.purchasedQuantity;
  this.status = this.purchasedQuantity > 0 ? 'partially_purchased' : 'pending';

  this.purchasedBy = null;
  this.purchasedAt = null;
  
  await this.save();
  
  const ShoppingList = mongoose.model('ShoppingList');
  const shoppingList = await ShoppingList.findById(this.shoppingList);
  if (shoppingList) {
    await shoppingList.updateMetadata();
  }
  
  return this;
};

itemSchema.methods.markAsNotAvailable = async function() {
  this.status = 'not_available';
  this.quantityToPurchase = this.quantity;
  await this.save();
  return this;
};

itemSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.quantityToPurchase = this.quantity;
  await this.save();
  return this;
};

itemSchema.methods.updateQuantity = async function(newQuantity: number) {
  if (newQuantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  this.quantity = newQuantity;
  this.quantityToPurchase = newQuantity;
  await this.save();
  return this;
};

itemSchema.statics.findByShoppingList = function(shoppingListId: string, options: IFindByShoppingListOptions = {}) {
  const {
    status = null,
    category = null,
    priority = null,
    search = null,
    sort = 'createdAt',
    populateProduct = false
  } = options;
  
  const query: FilterQuery<IItem> = { shoppingList: shoppingListId };
  
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (search) {
    query.$text = { $search: search };
  }
  
  let queryBuilder = this.find(query)
    .populate('addedBy', 'username firstName lastName avatar')
    .populate('purchasedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color');
  
  if (populateProduct) {
    queryBuilder = queryBuilder.populate('product', 'name brand image averagePrice price categoryId subCategoryId');
  }
  
  return queryBuilder.sort(sort);
};

itemSchema.statics.findByCategory = function(categoryId: string, options: IFindByCategoryOptions = {}) {
  const { limit = 20, sort = '-createdAt' } = options;
  
  return this.find({ category: new mongoose.Types.ObjectId(categoryId) })
    .populate('addedBy', 'username firstName lastName')
    .populate('category', 'name nameEn icon color')
    .sort(sort)
    .limit(limit);
};

itemSchema.statics.findSimilar = function(itemName: string, category?: ItemCategory) {
  const query: FilterQuery<IItem> = {
    name: { $regex: itemName, $options: 'i' }
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .select('name brand category estimatedPrice unit')
    .limit(5);
};

itemSchema.statics.getPopularItemsMostPurchasedByGroup = function (
  groupId: string,
  limit: number = 10
) {
  if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
    // אפשר גם: return [];
    throw new Error("Invalid groupId");
  }

  const gid = new mongoose.Types.ObjectId(groupId);

  const pipeline: PipelineStage[] = [
    // 1) join ל-shoppinglists כדי להגיע ל-group
    {
      $lookup: {
        from: "shoppinglists",
        localField: "shoppingList",
        foreignField: "_id",
        as: "list",
      },
    },
    { $unwind: "$list" },

    // 2) מסנן לפי הקבוצה
    { $match: { "list.group": gid } },

    // 3) רק פריטים שנקנו + יש product
    {
      $match: {
        product: { $ne: null },
        purchasedAt: { $ne: null },
        status: { $in: ["purchased", "partially_purchased"] },
        purchasedQuantity: { $gt: 0 },
      },
    },

    // 4) sort לפני group כדי ש-$first יהיה עקבי
    { $sort: { purchasedAt: -1, updatedAt: -1, createdAt: -1 } },

    // 5) group לפי product
    {
      $group: {
        _id: { product: "$product" },

        // מדדי פופולריות (מומלץ)
        totalPurchasedQty: { $sum: "$purchasedQuantity" }, // כמה יחידות נקנו
        purchaseEvents: { $sum: 1 }, // כמה פעמים נקנה

        lastPurchased: { $max: "$purchasedAt" },

        categoryId: { $first: "$category" },
        unit: { $first: "$unit" },
        brand: { $first: "$brand" },
        name: { $first: "$name" },
        image: { $first: "$image" },

        product: { $first: "$product" },
      },
    },

    // 6) sort + limit
    { $sort: { totalPurchasedQty: -1, purchaseEvents: -1, lastPurchased: -1 } },
    { $limit: limit },

    // 7) enrich product
    {
      $lookup: {
        from: "products",
        let: { productId: "$product" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
          {
            $project: {
              _id: 1,
              name: 1,
              brand: 1,
              image: 1,
              averagePrice: 1,
              price: 1,
              categoryId: 1,
              subCategoryId: 1,
            },
          },
        ],
        as: "productDoc",
      },
    },
    { $set: { product: { $arrayElemAt: ["$productDoc", 0] } } },

    // 8) תמונת מוצר fallback (cloudinary/imagekit)
    {
      $set: {
        productImage: {
          $let: {
            vars: { img: "$product.image" },
            in: {
              $ifNull: [
                {
                  $cond: [
                    { $eq: ["$$img.primary", "imagekit"] },
                    "$$img.providers.imagekit.url",
                    "$$img.providers.cloudinary.url",
                  ],
                },
                {
                  $ifNull: [
                    "$$img.providers.cloudinary.url",
                    "$$img.providers.imagekit.url",
                  ],
                },
              ],
            },
          },
        },
      },
    },

    // 9) אם אין image ב-item, נשתמש בתמונת מוצר
    {
      $set: {
        image: {
          $cond: [
            { $or: [{ $eq: ["$image", null] }, { $eq: ["$image", ""] }] },
            "$productImage",
            "$image",
          ],
        },
      },
    },

    // 10) cleanup
    { $project: { productDoc: 0, productImage: 0, list: 0 } },
  ];

  return this.aggregate(pipeline);
};



itemSchema.statics.getCategoryStats = function(shoppingListId?: string) {
  const matchConditions: FilterQuery<IItem> = {};
  
  if (shoppingListId) {
    matchConditions.shoppingList = new mongoose.Types.ObjectId(shoppingListId);
  }
  
  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        purchasedItems: {
          $sum: { $cond: [{ $eq: ['$status', 'purchased'] }, 1, 0] }
        },
        totalEstimated: { $sum: '$totalEstimatedCost' },
        totalActual: { $sum: '$totalActualCost' },
        avgPrice: { $avg: '$actualPrice' }
      }
    },
    {
      $addFields: {
        completionRate: {
          $multiply: [
            { $divide: ['$purchasedItems', '$totalItems'] },
            100
          ]
        }
      }
    },
    { $sort: { totalItems: -1 } }
  ]);
};

itemSchema.statics.searchItems = function(searchTerm: string, options: IItemQueryOptions = {}) {
  const { category, limit = 20, skip = 0 } = options;
  
  const query: FilterQuery<IItem> = {
    $text: { $search: searchTerm }
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit);
};

itemSchema.statics.findByProduct = function(productId: string, options: IItemQueryOptions = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({ product: new mongoose.Types.ObjectId(productId) })
    .populate('addedBy', 'username firstName lastName avatar')
    .populate('purchasedBy', 'username firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

itemSchema.statics.findManualItems = function(shoppingListId?: string, options: IItemQueryOptions = {}) {
  const { limit = 20, skip = 0 } = options;
  
  const query: FilterQuery<IItem> = { isManualEntry: true };
  
  if (shoppingListId) {
    query.shoppingList = new mongoose.Types.ObjectId(shoppingListId);
  }
  
  return this.find(query)
    .populate('addedBy', 'username firstName lastName avatar')
    .populate('purchasedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

itemSchema.statics.findProductBasedItems = function(shoppingListId?: string, options: IItemQueryOptions = {}) {
  const { limit = 20, skip = 0 } = options;
  
  const query: FilterQuery<IItem> = { 
    isManualEntry: { $ne: true },
    product: { $exists: true, $ne: null }
  };
  
  if (shoppingListId) {
    query.shoppingList = new mongoose.Types.ObjectId(shoppingListId);
  }
  
  return this.find(query)
    .populate('addedBy', 'username firstName lastName avatar')
    .populate('purchasedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color')
    .populate('product', 'name brand image averagePrice price categoryId subCategoryId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

const Item = mongoose.model<IItem, ItemModel>('Item', itemSchema);

export default Item;
