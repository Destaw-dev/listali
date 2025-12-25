import mongoose, { Schema, Model, FilterQuery } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser, IUserMethods } from '../types';

type UserModel = Model<IUser, Record<string, never>, IUserMethods> & {
  findByCredentials(email: string, password: string): Promise<IUser>;
  isUsernameAvailable(username: string, excludeId?: string): Promise<boolean>;
  isEmailAvailable(email: string, excludeId?: string): Promise<boolean>;
};


const userSchema = new Schema<IUser, UserModel, IUserMethods>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9_\u0590-\u05FF]+$/, 'Username can contain letters (Hebrew/English), numbers, and underscores']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },  
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    minlength: 8,
    select: false
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerification: {
    token: String,
    expiresAt: Date
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  preferences: {
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    newMessageNotifications: { type: Boolean, default: true },
    shoppingListUpdates: { type: Boolean, default: true },
    groupInvitations: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'he', enum: ['he', 'en', 'ar'] }
  },
  groups: [{
    type: Schema.Types.ObjectId,
    ref: 'Group'
  }],
  pendingInvitations: [{
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    code: {
      type: String,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      delete (ret as any).password;
      delete (ret as any).__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform(doc, ret) {
      delete (ret as any).password;
      delete (ret as any).__v;
      return ret;
    }
  }
  
});

// Indexes
userSchema.index({ groups: 1 });
userSchema.index({ lastSeen: -1 });

// Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update lastSeen
userSchema.pre('save', function (next) {
  if (this.isModified('lastSeen') || this.isNew) {
    this.lastSeen = new Date();
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// JWT token
userSchema.methods.getSignedJwtToken = function () {
  const payload = {
    id: this._id,
    username: this.username,
    email: this.email
  };

  const secret = process.env.JWT_SECRET || 'fallback-secret';

  const options: SignOptions = {
    expiresIn: '7d',
    issuer: 'smart-group-shopping',
    audience: 'smart-group-shopping-users'
  };

  return jwt.sign(payload, secret, options);
};


// Static: find by credentials
userSchema.statics.findByCredentials = async function (email: string, password: string) {
  const user = await this.findOne({ email, isActive: true }).select('+password');
  if (!user) throw new Error('Invalid credentials');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid credentials');
  user.lastSeen = new Date();
  await user.save();
  return user;
};

// Static: check if user can login (email verified and active)
userSchema.statics.canLogin = async function (email: string) {
  const user = await this.findOne({ email, isActive: true });
  if (!user) return false;
  return user.isEmailVerified;
};

// Static: check username availability
userSchema.statics.isUsernameAvailable = async function (username: string, excludeId?: string) {
  const query: FilterQuery<IUser> = {
    username: { $regex: new RegExp(`^${username}$`, 'i') }
  };
  if (excludeId) query._id = { $ne: excludeId };
  return !(await this.findOne(query));
};

// Static: check email availability
userSchema.statics.isEmailAvailable = async function (email: string, excludeId?: string) {
  const query: FilterQuery<IUser> = { email: email.toLowerCase() };
  if (excludeId) query._id = { $ne: excludeId };
  return !(await this.findOne(query));
};

// Virtuals
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('groupsCount').get(function () {
  return this.groups?.length;
});

const User = mongoose.model<IUser, UserModel>('User', userSchema);
export default User;
