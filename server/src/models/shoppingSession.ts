import mongoose, { Schema } from 'mongoose';
import { IShoppingSession } from '@/types';


const shoppingSessionSchema = new Schema<IShoppingSession>({
  listId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'ShoppingList'
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  groupId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Group'
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  location: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    },
    address: {
      type: String,
      required: false
    },
    storeName: {
      type: String,
      required: false
    }
  },
  itemsPurchased: {
    type: Number,
    required: true,
    default: 0
  },
  totalItems: {
    type: Number,
    required: true,
    default: 0
  },
  shoppingTime: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    required: true,
    default: 'active'
  },
  lastActivity: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
shoppingSessionSchema.index({ listId: 1, isActive: 1 });
shoppingSessionSchema.index({ userId: 1, isActive: 1 });
shoppingSessionSchema.index({ groupId: 1, isActive: 1 });
shoppingSessionSchema.index({ startedAt: -1 });

// Virtual for shopping duration
shoppingSessionSchema.virtual('duration').get(function() {
  if (this.endedAt) {
    return Math.round((this.endedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
  }
  return Math.round((Date.now() - this.startedAt.getTime()) / (1000 * 60));
});

// Method to end shopping session
shoppingSessionSchema.methods.endSession = function() {
  this.isActive = false;
  this.endedAt = new Date();
  this.status = 'completed';
  this.shoppingTime = this.duration;
  return this.save();
};

// Method to pause shopping session
shoppingSessionSchema.methods.pauseSession = function() {
  this.status = 'paused';
  this.lastActivity = new Date();
  return this.save();
};

// Method to resume shopping session
shoppingSessionSchema.methods.resumeSession = function() {
  this.status = 'active';
  this.lastActivity = new Date();
  return this.save();
};

// Method to update purchase count
shoppingSessionSchema.methods.updatePurchaseCount = function(purchased: number, total: number) {
  this.itemsPurchased = purchased;
  this.totalItems = total;
  this.lastActivity = new Date();
  return this.save();
};

// Static method to get active shopping sessions for a list
shoppingSessionSchema.statics.getActiveSessions = function(listId: string) {
  return this.find({ 
    listId, 
    isActive: true, 
    status: { $in: ['active', 'paused'] } 
  }).populate('userId', 'username firstName lastName avatar');
};

// Static method to get user's active shopping session
shoppingSessionSchema.statics.getUserActiveSession = function(userId: string) {
  return this.findOne({ 
    userId, 
    isActive: true, 
    status: { $in: ['active', 'paused'] } 
  });
};

export const ShoppingSession = mongoose.model<IShoppingSession>('ShoppingSession', shoppingSessionSchema); 