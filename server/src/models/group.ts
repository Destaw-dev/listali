import mongoose, { Schema, Model } from 'mongoose';
import { IGroup, IGroupMember } from '../types';

interface GroupModel extends Model<IGroup> {
  findByUser(userId: string): Promise<IGroup[]>;
}

const groupMemberSchema = new Schema<IGroupMember>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  permissions: {
    canCreateLists: {
      type: Boolean,
      default: true
    },
    canEditLists: {
      type: Boolean,
      default: true
    },
    canDeleteLists: {
      type: Boolean,
      default: false
    },
    canInviteMembers: {
      type: Boolean,
      default: false
    },
    canManageMembers: {
      type: Boolean,
      default: false
    }
  }
}, { _id: false });

const groupSchema = new Schema<IGroup, GroupModel>({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [2, 'Group name must be at least 2 characters'],
    maxlength: [50, 'Group name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  members: [groupMemberSchema],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    allowMemberInvite: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 50,
      min: [2, 'Group must allow at least 2 members'],
      max: [100, 'Group cannot exceed 100 members']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  shoppingLists: [{
    type: Schema.Types.ObjectId,
    ref: 'ShoppingList'
  }],
  pendingInvites: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    email: {
      type: String,
      required: false
    },
    code: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    type: {
      type: String,
      enum: ['in-app', 'email'],
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  joinRequests: [{
    _id: {
      type: Schema.Types.ObjectId,
      auto: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    inviteCode: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

groupSchema.index({ owner: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ createdAt: -1 });

groupSchema.virtual('membersCount').get(function () {
  return Array.isArray(this.members) ? this.members.length : 0;
});

groupSchema.virtual('activeListsCount').get(function () {
  return Array.isArray(this.shoppingLists) ? this.shoppingLists.length : 0;
});

groupSchema.pre('save', function(next) {
  const ownerInMembers = this.members.some(member => 
    member.user.toString() === this.owner.toString()
  );
  
  if (!ownerInMembers) {
    this.members.push({
      id: new mongoose.Types.ObjectId().toString(),
      userId: this.owner.toString(),
      groupId: this._id.toString(),
      user: this.owner,
      role: 'owner',
      joinedAt: new Date(),
      permissions: {
        canCreateLists: true,
        canEditLists: true,
        canDeleteLists: true,
        canInviteMembers: true,
        canManageMembers: true
      }
    });
  }
  
  next();
});

groupSchema.methods.addMember = function(userId: string, role: 'admin' | 'member' = 'member') {
  const existingMember = this.members.find((member: IGroupMember) => 
    member.user.toString() === userId
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this group');
  }
  
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Group has reached maximum member capacity');
  }
  
  let permissions;
  if (role === 'admin') {
    permissions = {
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: true,
      canInviteMembers: true,
      canManageMembers: true
    };
  } else {
    permissions = {
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: false,
      canInviteMembers: this.settings.allowMemberInvite,
      canManageMembers: false
    };
  }
  
  this.members.push({
    id: new mongoose.Types.ObjectId().toString(),
    userId,
    groupId: this._id.toString(),
    user: new mongoose.Types.ObjectId(userId),
    role,
    joinedAt: new Date(),
    permissions
  });  
  
  return this.save();
};

groupSchema.methods.removeMember = function(userId: string, removedBy: string) {
  const memberIndex = this.members.findIndex((member: IGroupMember) => 
    member.user.toString() === userId
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this group');
  }
  
  const memberToRemove = this.members[memberIndex];
  
  if (memberToRemove.role === 'owner') {
    throw new Error('Cannot remove the group owner');
  }
  
  const remover = this.members.find((member: IGroupMember) => 
    member.user.toString() === removedBy
  );
  
  if (!remover) {
    throw new Error('User not authorized to remove members');
  }
  
  if (remover.role !== 'owner' && !remover.permissions.canManageMembers && removedBy !== userId) {
    throw new Error('User not authorized to remove members remover.role !== owner');
  }
  
  this.members.splice(memberIndex, 1);
  return this.save();
};

groupSchema.methods.updateMemberRole = function(userId: string, newRole: 'admin' | 'member', updatedBy: string) {
  const member = this.members.find((member: IGroupMember) => 
    member.user.toString() === userId
  );
  
  if (!member) {
    throw new Error('User is not a member of this group');
  }
  
  if (member.role === 'owner') {
    throw new Error('Cannot change owner role');
  }
  
  const updater = this.members.find((member: IGroupMember) => 
    member.user.toString() === updatedBy
  );
  
  if (!updater || (updater.role !== 'owner' && !updater.permissions.canManageMembers)) {
    throw new Error('User not authorized to update member roles');
  }
  
  member.role = newRole;
  
  if (newRole === 'admin') {
    member.permissions = {
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: true,
      canInviteMembers: true,
      canManageMembers: true
    };
  } else {
    member.permissions = {
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: false,
      canInviteMembers: this.settings.allowMemberInvite,
      canManageMembers: false
    };
  }
  
  return this.save();
};

groupSchema.methods.transferOwnership = function(currentOwnerId: string, newOwnerId: string) {
  const currentOwner = this.members.find((member: IGroupMember) => 
    member.user.toString() === currentOwnerId
  );
  
  const newOwner = this.members.find((member: IGroupMember) => 
    member.user.toString() === newOwnerId
  );
  
  if (!currentOwner || currentOwner.role !== 'owner') {
    throw new Error('Current user is not the owner');
  }
  
  if (!newOwner) {
    throw new Error('New owner is not a member of this group');
  }
  
  if (currentOwnerId === newOwnerId) {
    throw new Error('Cannot transfer ownership to yourself');
  }
  
  currentOwner.role = 'admin';
  currentOwner.permissions = {
    canCreateLists: true,
    canEditLists: true,
    canDeleteLists: false,
    canInviteMembers: this.settings.allowMemberInvite,
    canManageMembers: true
  };
  
  newOwner.role = 'owner';
  newOwner.permissions = {
    canCreateLists: true,
    canEditLists: true,
    canDeleteLists: true,
    canInviteMembers: true,
    canManageMembers: true
  };
  
  this.owner = new mongoose.Types.ObjectId(newOwnerId);
  
  return this.save();
};

groupSchema.methods.hasPermission = function(userId: string, permission: string) {
  const member = this.members.find((member: IGroupMember) => 
    member.user.toString() === userId
  );
  
  if (!member) {
    return false;
  }
  
  if (member.role === 'owner') {
    return true;
  }
  
  return member.permissions[permission as keyof typeof member.permissions] || false;
};

groupSchema.statics.findByUser = function(userId: string) {
  return this.find({
    'members.user': userId,
    isActive: true
  }).populate('members.user', 'username firstName lastName avatar')
    .populate('owner', 'username firstName lastName avatar')
    .sort({ updatedAt: -1 });
};

const Group = mongoose.model<IGroup, GroupModel>('Group', groupSchema);

export default Group;