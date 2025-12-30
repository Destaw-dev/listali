import mongoose, { Schema, Model, FilterQuery } from "mongoose";
import { 
  IMessage, 
  IReadStatus, 
  MessageDocument,
  IFindByGroupOptions,
  ISearchMessagesOptions,
  IBaseMessage,
  IMessageStatistic
} from "../types";

type MessageModel = Model<MessageDocument> & {
  findByGroup(groupId: string, options?: IFindByGroupOptions): Promise<MessageDocument[]>;
  getUnreadMessages(
    userId: string,
    groupId?: string
  ): Promise<MessageDocument[]>;
  markAllAsRead(userId: string, groupId: string): Promise<number>;
  searchMessages(
    groupId: string,
    searchTerm: string,
    options: ISearchMessagesOptions
  ): Promise<MessageDocument[]>;
  getStatistics(
    groupId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<IMessageStatistic[]>;
  createListUpdateMessage(
    groupId: string,
    listId: string,
    action: string,
    username: string,
    listName?: string
  ): Promise<MessageDocument>;
  getMostActiveUsers(
    groupId: string,
    limit?: number,
    timeRange?: { start: Date ; end: Date }
  ): Promise<MessageDocument[]>;
  createItemUpdateMessage(
    groupId: string,
    itemId: string,
    action: 'add' | 'update' | 'delete' | 'purchase' | 'unpurchase',
    username: string,
    listId: string
  ): Promise<MessageDocument>;
};

const readStatusSchema = new Schema<IReadStatus>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessage, MessageModel, MessageDocument>(
  {
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !['system', 'item_update', 'list_update'].includes(this.messageType);
      },
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group is required"],
    },
    messageType: {
      type: String,
      enum: ["text", "image", "system", "item_update", "list_update"],
      default: "text",
    },
    metadata: {
      itemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        default: null,
      },
      listId: {
        type: Schema.Types.ObjectId,
        ref: "ShoppingList",
        default: null,
      },
      imageUrl: {
        type: String,
        validate: {
          validator: function (v: string) {
            return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
          },
          message:
            "Image URL must be a valid URL ending with jpg, jpeg, png, gif, or webp",
        },
      },
      fileName: {
        type: String,
        maxlength: [100, "File name cannot exceed 100 characters"],
      },
      fileSize: {
        type: Number,
        min: [0, "File size cannot be negative"],
      },
    },
    readBy: [readStatusSchema],
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ "readBy.user": 1 });
messageSchema.index({ isDeleted: 1, createdAt: -1 });
messageSchema.index({ content: "text" });

// Virtual for is edited
messageSchema.virtual("isEdited").get(function () {
  return !!this.editedAt;
});

// Virtual for unread count for a specific user
messageSchema.virtual("isReadBy").get(function () {
  // This will be set dynamically when querying
  return false;
});

// Virtual for read count
messageSchema.virtual("readCount").get(function () {
  return this.readBy.length;
});

// Pre-save middleware
messageSchema.pre("save", function (next) {
  // Set editedAt when content is modified (but not on creation)
  if (this.isModified("content") && !this.isNew) {
    this.editedAt = new Date();
  }

  next();
});

// Instance method to mark as read by user
messageSchema.methods.markAsRead = async function (userId: string) {
  // Check if user already read this message
  const existingRead = this.readBy.find(
    (read: IReadStatus) => read.user.toString() === userId
  );

  if (!existingRead) {
    this.readBy.push({
      user: new mongoose.Types.ObjectId(userId),
      readAt: new Date(),
    });
    await this.save();
  }

  return this;
};

// Instance method to edit message
messageSchema.methods.editMessage = async function (
  newContent: string,
  editorId: string
) {
  // Only sender can edit
  if (this.sender.toString() !== editorId) {
    throw new Error("Only the sender can edit this message");
  }

  // Can't edit system messages
  if (this.messageType === "system") {
    throw new Error("System messages cannot be edited");
  }

  // Can't edit messages older than 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (this.createdAt < oneDayAgo) {
    throw new Error("Messages older than 24 hours cannot be edited");
  }

  this.content = newContent;
  this.editedAt = new Date();
  await this.save();

  return this;
};

messageSchema.methods.deleteMessage = async function (deleterId: string) {

  if (this.sender._id.toString() !== deleterId) {
    throw new Error("Only the sender can delete this message");
  }

  // Can't delete system messages
  if (this.messageType === "system") {
    throw new Error("System messages cannot be deleted");
  }

  this.isDeleted = true;
  this.content = "this message has been deleted";
  await this.save();

  return this;
};

messageSchema.statics.findByGroup = function (
  groupId: string,
  options: IFindByGroupOptions = {}
) {
  const {
    limit = 50,
    before = null,
    after = null,
    messageType = null,
    search = null,
    includeDeleted = false,
  } = options;

  const query: FilterQuery<IMessage> = { group: groupId };

  if (!includeDeleted) {
    query.isDeleted = false;
  }

  if (messageType) {
    query.messageType = messageType;
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (before) {
    query._id = { $lt: before };
  } else if (after) {
    query._id = { $gt: after };
  }

  const sortOrder = -1;

  return this.find(query)
    .populate("sender", "username firstName lastName avatar")
    .populate("metadata.itemId", "name")
    .populate("metadata.listId", "name")
    .sort({ createdAt: sortOrder })
    .limit(limit);
};

messageSchema.statics.getUnreadMessages = function (
  userId: string,
  groupId?: string
) {
  const query: FilterQuery<IMessage> = {
    "readBy.user": { $ne: userId },
    isDeleted: false,
    sender: { $ne: userId },
  };

  if (groupId) {
    query.group = groupId;
  }

  return this.find(query)
    .populate("sender", "username firstName lastName avatar")
    .populate("group", "name")
    .sort({ createdAt: -1 });
};

messageSchema.statics.markAllAsRead = async function (
  userId: string,
  groupId: string
) {
  const result = await this.updateMany(
    {
      group: groupId,
      "readBy.user": { $ne: userId },
      isDeleted: false,
      sender: { $ne: userId },
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    }
  );
  
  return result.modifiedCount;
};

messageSchema.statics.getStatistics = function (
  groupId: string,
  timeRange?: { start: Date; end: Date }
) {
  const matchConditions: FilterQuery<IMessage> = {
    group: new mongoose.Types.ObjectId(groupId),
    isDeleted: false,
  };

  if (timeRange) {
    matchConditions.createdAt = {
      $gte: timeRange.start,
      $lte: timeRange.end,
    };
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          type: "$messageType",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
        count: { $sum: 1 },
        avgReadTime: {
          $avg: {
            $subtract: [{ $arrayElemAt: ["$readBy.readAt", 0] }, "$createdAt"],
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.type",
        totalMessages: { $sum: "$count" },
        dailyStats: {
          $push: {
            date: "$_id.date",
            count: "$count",
            avgReadTime: "$avgReadTime",
          },
        },
      },
    },
  ]);
};

messageSchema.statics.searchMessages = function (
  groupId: string,
  searchTerm: string,
  options: ISearchMessagesOptions = {}
) {
  const { limit = 20, skip = 0, messageType = null } = options;

  const query: FilterQuery<IMessage> = {
    group: groupId,
    $text: { $search: searchTerm },
    isDeleted: false,
  };

  if (messageType) {
    query.messageType = messageType;
  }

  return this.find(query, { score: { $meta: "textScore" } })
    .populate("sender", "username firstName lastName avatar")
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get most active users in group
messageSchema.statics.getMostActiveUsers = function (
  groupId: string,
  timeRange?: { start: Date; end: Date },
  limit: number = 10
) {
  const matchConditions: FilterQuery<IMessage> = {
    group: new mongoose.Types.ObjectId(groupId),
    isDeleted: false,
    messageType: { $ne: "system" },
  };

  if (timeRange) {
    matchConditions.createdAt = {
      $gte: timeRange.start,
      $lte: timeRange.end,
    };
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: "$sender",
        messageCount: { $sum: 1 },
        lastMessage: { $max: "$createdAt" },
        avgMessageLength: { $avg: { $strLenCP: "$content" } },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 1,
        messageCount: 1,
        lastMessage: 1,
        avgMessageLength: 1,
        username: "$user.username",
        firstName: "$user.firstName",
        lastName: "$user.lastName",
        avatar: "$user.avatar",
      },
    },
    { $sort: { messageCount: -1 } },
    { $limit: limit },
  ]);
};

// Static method to create system message
messageSchema.statics.createSystemMessage = function (
  groupId: string,
  content: string,
  metadata: IBaseMessage['metadata'] = {}
) {
  return this.create({
    content,
    sender: null, // System messages don't have a sender 
    group: groupId,
    messageType: "system",
    metadata,
    readBy: [], // System messages start unread
  });
};

// Static method to create item update message
messageSchema.statics.createItemUpdateMessage = function (
  groupId: string,
  itemId: string,
  action: string,
  username: string,
  listId: string
) {
  const actionMessages: Record<string, string> = {
    add: `${username} הוסיף/ה פריט לרשימה`,
    update: `${username} עדכן/נה פריט`,
    purchase: `${username} קנה/תה פריט`,
    unpurchase: `${username} ביטל/ה קנייה`,
    delete: `${username} מחק/ה פריט מהרשימה`,
  };

  return this.create({
    content: actionMessages[action] || `${username} עדכן/נה פריט`,
    sender: null,
    group: groupId,
    messageType: "item_update",
    metadata: { itemId, listId },
    readBy: [],
  });
};

// Static method to create list update message
messageSchema.statics.createListUpdateMessage = function (
  groupId: string,
  listId: string,
  action: string,
  username: string,
  listName?: string
) {
  const actionMessages: Record<string, string> = {
    create: `${username} יצר/ה רשימת קניות חדשה${
      listName ? `: ${listName}` : ""
    }`,
    update: `${username} עדכן/נה רשימת קניות${listName ? `: ${listName}` : ""}`,
    complete: `${username} סיים/ה רשימת קניות${
      listName ? `: ${listName}` : ""
    }`,
    reopen: `${username} פתח/ה מחדש רשימת קניות${
      listName ? `: ${listName}` : ""
    }`,
    delete: `${username} מחק/ה רשימת קניות${listName ? `: ${listName}` : ""}`,
  };

  return this.create({
    content: actionMessages[action] || `${username} עדכן/נה רשימת קניות`,
    sender: null,
    group: groupId,
    messageType: "list_update",
    metadata: { listId },
    readBy: [],
  });
};

// Ensure virtuals are included in JSON
messageSchema.set("toJSON", { virtuals: true });
messageSchema.set("toObject", { virtuals: true });

const Message = mongoose.model<IMessage, MessageModel>(
  "Message",
  messageSchema
);

export default Message;
