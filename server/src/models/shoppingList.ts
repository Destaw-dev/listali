import mongoose, { Schema, Model, FilterQuery } from 'mongoose';
import { 
  IGroupMember, 
  IShoppingList,
  IFindByGroupShoppingListOptions,
  ISearchMessagesOptions,
  IGroupStatistics
} from '../types';

type ShoppingListModel = Model<IShoppingList>& {
    findByGroup(groupId: string, options?: IFindByGroupShoppingListOptions): Promise<IShoppingList[]>;
    getUnreadMessages(userId: string, groupId?: string): Promise<IShoppingList[]>;
    markAllAsRead(userId: string, groupId: string): Promise<number>;
    searchMessages(groupId: string, searchTerm: string, options: ISearchMessagesOptions): Promise<IShoppingList[]>;
    getStatistics(groupId: string, timeRange?: { start: Date, end: Date }): Promise<IGroupStatistics>;
    findOverdue(groupId: string): Promise<IShoppingList[]>
  };

const shoppingListSchema = new Schema<IShoppingList, ShoppingListModel>({
  name: {
    type: String,
    required: [true, 'Shopping list name is required'],
    trim: true,
    minlength: [2, 'List name must be at least 2 characters'],
    maxlength: [100, 'List name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'Item'
  }],
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  shoppingSessions: [{
    type: Schema.Types.ObjectId,
    ref: 'ShoppingSession'
  }],
  completedAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  metadata: {
    estimatedTotal: {
      type: Number,
      min: [0, 'Estimated total cannot be negative'],
      default: 0
    },
    actualTotal: {
      type: Number,
      min: [0, 'Actual total cannot be negative'],
      default: 0
    },
    itemsCount: {
      type: Number,
      default: 0,
      min: [0, 'Items count cannot be negative']
    },
    completedItemsCount: {
      type: Number,
      default: 0,
      min: [0, 'Completed items count cannot be negative']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

shoppingListSchema.index({ group: 1, status: 1 });
shoppingListSchema.index({ createdBy: 1 });
shoppingListSchema.index({ assignedTo: 1 });
shoppingListSchema.index({ status: 1, createdAt: -1 });
shoppingListSchema.index({ priority: 1, status: 1 });
shoppingListSchema.index({ tags: 1 });

shoppingListSchema.virtual('completionPercentage').get(function() {
  if (this.metadata.itemsCount === 0) return 0;
  return Math.round((this.metadata.completedItemsCount / this.metadata.itemsCount) * 100);
});


shoppingListSchema.virtual('budgetDifference').get(function() {
    if (this.metadata.actualTotal && this.metadata.estimatedTotal) {
        return this.metadata.actualTotal - this.metadata.estimatedTotal;
      }
      return;
});

shoppingListSchema.pre('save', async function(next) {
  if (this.items.length > 0) {
    const Item = mongoose.model('Item');
    const items = await Item.find({ _id: { $in: this.items } });
    
    this.metadata.itemsCount = items.length;
    this.metadata.completedItemsCount = items.filter(item => item.status === 'purchased').length;
    this.metadata.estimatedTotal = items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0);
    this.metadata.actualTotal = items
      .filter(item => item.status === 'purchased')
      .reduce((sum, item) => sum + (item.actualPrice || 0) * item.quantity, 0);
  } else {
    this.metadata.itemsCount = 0;
    this.metadata.completedItemsCount = 0;
    this.metadata.estimatedTotal = 0;
    this.metadata.actualTotal = 0;
  }
  
  if (this.metadata.itemsCount > 0 && 
      this.metadata.completedItemsCount === this.metadata.itemsCount && 
      this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.metadata.itemsCount > 0 && 
      this.metadata.completedItemsCount !== this.metadata.itemsCount && 
      this.status === 'completed') {
    this.status = 'active';
    this.completedAt = null;
  }
  
  if (this.isModified('status') && this.status !== 'completed') {
    this.completedAt = null;
  }
  
  next();
});

shoppingListSchema.methods.updateMetadata = async function() {
  if (this.items.length > 0) {
    const Item = mongoose.model('Item');
    const items = await Item.find({ _id: { $in: this.items } });
    
    this.metadata.itemsCount = items.length;
    this.metadata.completedItemsCount = items.filter(item => item.status === 'purchased').length;
    this.metadata.estimatedTotal = items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0);
    this.metadata.actualTotal = items
      .filter(item => item.status === 'purchased')
      .reduce((sum, item) => sum + (item.actualPrice || 0) * item.quantity, 0);
  } else {
    this.metadata.itemsCount = 0;
    this.metadata.completedItemsCount = 0;
    this.metadata.estimatedTotal = 0;
    this.metadata.actualTotal = 0;
  }
  
  await this.save();
  return this;
};


shoppingListSchema.methods.addItem = async function(itemId: string) {
  if (this.items.includes(itemId)) {
    throw new Error('Item is already in this shopping list');
  }

  if (this.status !== 'active') {
    throw new Error('Can only add item to active shopping list');
  }

  const Item = mongoose.model('Item');
  const item = await Item.findById(itemId);

  if (!item) {
    throw new Error('Item not found');
  }

  if (item.shoppingList.toString() !== this._id.toString()) {
    throw new Error('Item does not belong to this shopping list');
  }
  
  this.items.push(itemId);
  await this.save();
  return this;
};

shoppingListSchema.methods.removeItem = async function(itemId: string) {
  const itemIndex = this.items.findIndex((id: string | mongoose.Types.ObjectId)=> id.toString() === itemId);
  
  if (itemIndex === -1) {
    throw new Error('Item not found in this shopping list');
  }
  
  this.items.splice(itemIndex, 1);
  await this.save();
  return this;
};

shoppingListSchema.methods.complete = async function() {
  if (this.status !== 'active') {
    throw new Error('Can only complete active lists');
  }
  
  this.status = 'completed';
  this.completedAt = new Date();
  await this.save();
  return this;
};

shoppingListSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
  return this;
};

shoppingListSchema.methods.reopen = async function() {
  if (this.status !== 'completed') {
    throw new Error('Can only reopen completed lists');
  }
  
  this.status = 'active';
  this.completedAt = null;
  await this.save();
  return this;
};

shoppingListSchema.methods.assignTo = async function(userId: string) {
  const Group = mongoose.model('Group');
  const group = await Group.findById(this.group);
  
  if (!group || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    throw new Error('User is not a member of this group');
  }
  
  this.assignedTo = new mongoose.Types.ObjectId(userId);
  await this.save();
  return this;
};

shoppingListSchema.methods.unassign = async function() {
  this.assignedTo = null;
  await this.save();
  return this;
};

shoppingListSchema.statics.findByGroup = function(groupId: string, options: IFindByGroupShoppingListOptions = {}) {
  const {
    status = null,
    assignedTo = null,
    priority = null,
    tags = null,
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = options;
  
  const query: FilterQuery<IShoppingList> = { group: groupId };
  
  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;
  if (priority) query.priority = priority;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate('items')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

shoppingListSchema.statics.findOverdue = function(groupId?: string) {
  const query: FilterQuery<IShoppingList> = {
    status: 'active',
  };
  
  if (groupId) query.group = groupId;
  
  return this.find(query)
    .populate('createdBy', 'username firstName lastName')
    .populate('assignedTo', 'username firstName lastName')
    .populate('group', 'name');
};

shoppingListSchema.statics.getStatistics = async function(groupId: string, timeRange?: { start: Date, end: Date }) {
  const matchConditions: FilterQuery<IShoppingList> = { group: new mongoose.Types.ObjectId(groupId) };
  
  if (timeRange) {
    matchConditions.createdAt = {
      $gte: timeRange.start,
      $lte: timeRange.end
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalEstimated: { $sum: '$metadata.estimatedTotal' },
        totalActual: { $sum: '$metadata.actualTotal' },
        avgCompletionTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              { $subtract: ['$completedAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
  
  return stats;
};

shoppingListSchema.set('toJSON', { virtuals: true });
shoppingListSchema.set('toObject', { virtuals: true });

const ShoppingList = mongoose.model<IShoppingList, ShoppingListModel>('ShoppingList', shoppingListSchema);

export default ShoppingList;