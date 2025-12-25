import mongoose, { Schema, Model, FilterQuery } from 'mongoose';
import { IItem, ItemDocument, ItemCategory, ItemUnit } from '../types';

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
  getPopularItems(groupId?: string, limit?: number): Promise<ItemDocument[]>;
  getCategoryStats(shoppingListId?: string): Promise<any[]>;
  searchItems(searchTerm: string, options?: any): Promise<ItemDocument[]>;
  findByProduct(productId: string, options?: any): Promise<ItemDocument[]>;
  findManualItems(shoppingListId?: string, options?: any): Promise<ItemDocument[]>;
  findProductBasedItems(shoppingListId?: string, options?: any): Promise<ItemDocument[]>;
};

// Predefined categories and units (not currently used, kept for future reference)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _CATEGORIES: ItemCategory[] = [
  'fruits_vegetables', 'meat_fish', 'dairy', 'bakery', 'pantry',
  'frozen', 'beverages', 'snacks', 'household', 'personal_care', 'other'
];

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
  image: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image must be a valid URL ending with jpg, jpeg, png, gif, or webp'
    }
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
    enum: ['pending', 'purchased', 'not_available', 'cancelled'],
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
  // Product relationship fields
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

// Indexes for performance
itemSchema.index({ shoppingList: 1, status: 1 });
itemSchema.index({ addedBy: 1 });
itemSchema.index({ purchasedBy: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ priority: 1, status: 1 });
itemSchema.index({ barcode: 1 });
itemSchema.index({ status: 1, createdAt: -1 });
itemSchema.index({ name: 'text', description: 'text' });
// New indexes for product relationship
itemSchema.index({ product: 1 });
itemSchema.index({ isManualEntry: 1 });

// Virtual for total estimated cost
itemSchema.virtual('totalEstimatedCost').get(function() {
  return this.estimatedPrice ? this.estimatedPrice * this.quantity : 0;
});

// Virtual for total actual cost
itemSchema.virtual('totalActualCost').get(function() {
  return this.actualPrice ? this.actualPrice * this.quantity : 0;
});

// Virtual for cost difference
itemSchema.virtual('costDifference').get(function() {
  if (!this.estimatedPrice || !this.actualPrice) return 0;
  return (this.actualPrice - this.estimatedPrice) * this.quantity;
});

// Virtual for is purchased (fully purchased)
itemSchema.virtual('isPurchased').get(function() {
  const purchasedQty = this.purchasedQuantity || 0;
  return purchasedQty >= this.quantity && this.quantity > 0;
});

// Virtual for is partially purchased
itemSchema.virtual('isPartiallyPurchased').get(function() {
  const purchasedQty = this.purchasedQuantity || 0;
  return purchasedQty > 0 && purchasedQty < this.quantity;
});

// Virtual for remaining quantity
itemSchema.virtual('remainingQuantity').get(function() {
  const purchasedQty = this.purchasedQuantity || 0;
  return Math.max(0, this.quantity - purchasedQty);
});

// Virtual for display name (name + brand if available)
itemSchema.virtual('displayName').get(function() {
  return this.brand ? `${this.name} (${this.brand})` : this.name;
});

// Virtual for quantity with unit
itemSchema.virtual('quantityWithUnit').get(function() {
  return `${this.quantity} ${this.unit}${this.quantity > 1 && this.unit === 'piece' ? 's' : ''}`;
});

// Virtual for product-based item
itemSchema.virtual('isProductBased').get(function() {
  return !this.isManualEntry && !!this.product;
});

// Virtual for has product reference
itemSchema.virtual('hasProduct').get(function() {
  return !!this.product;
});

// Pre-save middleware
itemSchema.pre('save', function(next) {
  // Update status based on purchasedQuantity
  if (this.isModified('purchasedQuantity') || this.isModified('quantity')) {
    const purchasedQty = this.purchasedQuantity || 0;
    if (purchasedQty >= this.quantity && this.quantity > 0) {
      this.status = 'purchased';
      if (!this.purchasedAt) {
        this.purchasedAt = new Date();
      }
    } else if (purchasedQty > 0) {
      // Partially purchased - keep status as 'pending' but mark as partially purchased
      this.status = 'pending';
    } else {
      this.status = 'pending';
      this.purchasedBy = null;
      this.purchasedAt = null;
    }
  }
  
  // Set purchased info when status changes to purchased
  if (this.isModified('status') && this.status === 'purchased' && !this.purchasedAt) {
    this.purchasedAt = new Date();
  }
  
  // Clear purchased info when status changes from purchased
  if (this.isModified('status') && this.status !== 'purchased' && this.purchasedQuantity === 0) {
    this.purchasedBy = null;
    this.purchasedAt = null;
  }
  
  // Normalize unit to lowercase
  if (this.isModified('unit')) {
    this.unit = this.unit.toLowerCase() as ItemUnit;
  }
  
  next();
});

// Instance method to mark as purchased (with optional purchasedQuantity and actualPrice)
itemSchema.methods.markAsPurchased = async function(
  purchasedBy: string, 
  purchasedQuantity?: number, 
  actualPrice?: number
) {
  const quantityToPurchase = purchasedQuantity !== undefined ? purchasedQuantity : this.quantity;
  
  // Validate purchasedQuantity
  if (quantityToPurchase < 0 || quantityToPurchase > this.quantity) {
    throw new Error('Purchased quantity must be between 0 and total quantity');
  }
  
  this.purchasedQuantity = quantityToPurchase;
  this.purchasedBy = new mongoose.Types.ObjectId(purchasedBy);
  
  if (quantityToPurchase >= this.quantity) {
    this.status = 'purchased';
    this.purchasedAt = new Date();
  } else if (quantityToPurchase > 0) {
    this.status = 'pending';
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
  
  // Update shopping list metadata
  const ShoppingList = mongoose.model('ShoppingList');
  const shoppingList = await ShoppingList.findById(this.shoppingList);
  if (shoppingList) {
    await shoppingList.updateMetadata();
  }
  
  return this;
};

// Instance method to mark as not purchased (reset purchasedQuantity to 0)
itemSchema.methods.markAsNotPurchased = async function() {
  this.purchasedQuantity = 0;
  this.status = 'pending';
  this.purchasedBy = null;
  this.purchasedAt = null;
  
  await this.save();
  
  // Update shopping list metadata
  const ShoppingList = mongoose.model('ShoppingList');
  const shoppingList = await ShoppingList.findById(this.shoppingList);
  if (shoppingList) {
    await shoppingList.updateMetadata();
  }
  
  return this;
};

// Instance method to mark as not available
itemSchema.methods.markAsNotAvailable = async function() {
  this.status = 'not_available';
  await this.save();
  return this;
};

// Instance method to cancel
itemSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  await this.save();
  return this;
};

// Instance method to update quantity
itemSchema.methods.updateQuantity = async function(newQuantity: number) {
  if (newQuantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  this.quantity = newQuantity;
  await this.save();
  return this;
};

// Static method to find by shopping list
itemSchema.statics.findByShoppingList = function(shoppingListId: string, options: any = {}) {
  const {
    status = null,
    category = null,
    priority = null,
    search = null,
    sort = 'createdAt',
    populateProduct = false
  } = options;
  
  const query: any = { shoppingList: shoppingListId };
  
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

// Static method to find by category
itemSchema.statics.findByCategory = function(categoryId: string, options: any = {}) {
  const { limit = 20, sort = '-createdAt' } = options;
  
  return this.find({ category: new mongoose.Types.ObjectId(categoryId) })
    .populate('addedBy', 'username firstName lastName')
    .populate('category', 'name nameEn icon color')
    .sort(sort)
    .limit(limit);
};

// Static method to find similar items
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

// Static method to get popular items
itemSchema.statics.getPopularItems = function(groupId?: string, limit: number = 10) {
  const pipeline: any[] = [
    {
      $group: {
        _id: {
          name: '$name',
          category: '$category',
          unit: '$unit'
        },
        count: { $sum: 1 },
        avgPrice: { $avg: '$actualPrice' },
        lastPurchased: { $max: '$purchasedAt' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ];

  if (groupId && mongoose.Types.ObjectId.isValid(groupId)) {
    pipeline.unshift({
      $lookup: {
        from: 'shoppinglists',
        localField: 'shoppingList',
        foreignField: '_id',
        as: 'list'
      }
    });

    pipeline.unshift({
      $match: { 'list.group': new mongoose.Types.ObjectId(groupId) }
    });
  }

  return this.aggregate(pipeline);
};

// Static method to get category statistics
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

// Static method to search items
itemSchema.statics.searchItems = function(searchTerm: string, options: any = {}) {
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

// Static method to find items by product
itemSchema.statics.findByProduct = function(productId: string, options: any = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({ product: new mongoose.Types.ObjectId(productId) })
    .populate('addedBy', 'username firstName lastName avatar')
    .populate('purchasedBy', 'username firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find manual items
itemSchema.statics.findManualItems = function(shoppingListId?: string, options: any = {}) {
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

// Static method to find product-based items
itemSchema.statics.findProductBasedItems = function(shoppingListId?: string, options: any = {}) {
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

// Ensure virtuals are included in JSON
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

const Item = mongoose.model<IItem, ItemModel>('Item', itemSchema);

export default Item;