import mongoose, { Schema, Model, FilterQuery } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserMethods, IRefreshSession } from '../types';

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
    match: [
      /^[a-zA-Z0-9._\-\u0590-\u05FF]+$/,
      'Username can contain letters (Hebrew/English), numbers, underscores, dots, and hyphens'
    ]
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
    theme: { type: String, default: 'light', enum: ['light', 'dark', 'system'] },
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
  }],
  refreshSessions: [{
    sessionId: {
      type: String,
      required: true
    },
    refreshTokenHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    },
    userAgent: {
      type: String
    },
    ip: {
      type: String
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret: Partial<IUser> & { password?: string; __v?: number }) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform(_doc, ret: Partial<IUser> & { password?: string; __v?: number }) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
  
});

userSchema.index({ groups: 1 });
userSchema.index({ lastSeen: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('lastSeen') || this.isNew) {
    this.lastSeen = new Date();
  }
  
  // Clean up invalid refresh sessions (null/empty sessionIds)
  if (this.isModified('refreshSessions') || this.isNew) {
    this.refreshSessions = this.refreshSessions.filter(
      (session: IRefreshSession) => session.sessionId && session.sessionId.trim() !== ''
    );
    
    // Remove duplicate sessionIds (keep the most recent one)
    const seen = new Map<string, IRefreshSession>();
    for (const session of this.refreshSessions) {
      const existing = seen.get(session.sessionId);
      if (!existing || (session.lastUsedAt && existing.lastUsedAt && session.lastUsedAt > existing.lastUsedAt)) {
        seen.set(session.sessionId, session);
      }
    }
    this.refreshSessions = Array.from(seen.values());
  }
  
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByCredentials = async function (email: string, password: string) {
  const user = await this.findOne({ email, isActive: true }).select('+password');
  if (!user) throw new Error('Invalid credentials');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid credentials');
  user.lastSeen = new Date();
  await user.save();
  return user;
};

userSchema.statics.canLogin = async function (email: string) {
  const user = await this.findOne({ email, isActive: true });
  if (!user) return false;
  return user.isEmailVerified;
};

userSchema.statics.isUsernameAvailable = async function (username: string, excludeId?: string) {
  const query: FilterQuery<IUser> = {
    username: { $regex: new RegExp(`^${username}$`, 'i') }
  };
  if (excludeId) query._id = { $ne: excludeId };
  return !(await this.findOne(query));
};

userSchema.statics.isEmailAvailable = async function (email: string, excludeId?: string) {
  const query: FilterQuery<IUser> = { email: email.toLowerCase() };
  if (excludeId) query._id = { $ne: excludeId };
  return !(await this.findOne(query));
};

userSchema.methods.pruneExpiredSessions = function (now: Date = new Date()) {
  this.refreshSessions = this.refreshSessions.filter(
    (session: IRefreshSession) => session.expiresAt > now
  );
};

userSchema.methods.enforceMaxSessions = function (max: number = 5) {
  this.pruneExpiredSessions();
  const activeSessions = this.refreshSessions.filter(
    (session: IRefreshSession) => session.expiresAt && session.expiresAt > new Date()
  );
  
  if (activeSessions.length >= max) {
    const sortedSessions = [...activeSessions].sort(
      (a: IRefreshSession, b: IRefreshSession) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    );
    const oldestSessionId = sortedSessions[0]?.sessionId;
    if (oldestSessionId) {
      this.refreshSessions = this.refreshSessions.filter(
        (session: IRefreshSession) => session.sessionId !== oldestSessionId
      );
    }
  }
};

userSchema.methods.addSession = function (session: {
  sessionId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
}) {
  // Validate sessionId is not null or undefined
  if (!session.sessionId || session.sessionId.trim() === '') {
    throw new Error('Session ID is required and cannot be null or empty');
  }

  // Check for duplicate sessionId within the array
  const existingSession = this.refreshSessions.find(
    (s: IRefreshSession) => s.sessionId === session.sessionId
  );
  if (existingSession) {
    // If session exists, update it instead of creating a duplicate
    existingSession.refreshTokenHash = session.refreshTokenHash;
    existingSession.expiresAt = session.expiresAt;
    existingSession.lastUsedAt = new Date();
    if (session.userAgent !== undefined) {
      existingSession.userAgent = session.userAgent;
    }
    if (session.ip !== undefined) {
      existingSession.ip = session.ip;
    }
    return;
  }

  const sessionData: IRefreshSession = {
    sessionId: session.sessionId,
    refreshTokenHash: session.refreshTokenHash,
    expiresAt: session.expiresAt,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    ...(session.userAgent !== undefined && { userAgent: session.userAgent }),
    ...(session.ip !== undefined && { ip: session.ip }),
  };
  this.refreshSessions.push(sessionData);
};

userSchema.methods.rotateSession = function (
  sessionId: string,
  newRefreshTokenHash: string,
  newExpiresAt: Date
) {
  const session = this.refreshSessions.find(
    (s: IRefreshSession) => s.sessionId === sessionId
  );
  if (session) {
    session.refreshTokenHash = newRefreshTokenHash;
    session.expiresAt = newExpiresAt;
    session.lastUsedAt = new Date();
  }
};

userSchema.methods.revokeSession = function (sessionId: string) {
  this.refreshSessions = this.refreshSessions.filter(
    (session: IRefreshSession) => session.sessionId !== sessionId
  );
};

userSchema.methods.revokeAllSessions = function () {
  this.refreshSessions = [];
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('groupsCount').get(function () {
  return this.groups?.length;
});

const User = mongoose.model<IUser, UserModel>('User', userSchema);
export default User;
