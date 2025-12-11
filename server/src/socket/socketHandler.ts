import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user';
import Group from '../models/group';
import Message from '../models/message';
import { ISocketUser, ISocketMessage, ISocketItemUpdate, ISocketUserStatus } from '../types';

// Global io instance for external access
let globalIO: Server | null = null;

// ---------------- In-memory connections ----------------
const connectedUsers = new Map<string, ISocketUser>(); // socketId -> ISocketUser
const userSockets = new Map<string, string>();         // userId   -> socketId

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

// For debug: log all connected users per connection/disconnection
function logConnectedUsers(where: string) {
  const list = Array.from(connectedUsers.values()).map(u => ({
    userId: u.userId,
    username: u.username,
    socketId: u.socketId,
    groups: u.groups,
    status: u.status
  }));
}

export const initializeSocket = (io: Server): void => {
  // Store global reference
  globalIO = io;
  // 1) Auth middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication error: No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

      // Ensure Mongo connected
      if (mongoose.connection.readyState !== 1) {
        await new Promise((resolve) => {
          if (mongoose.connection.readyState === 1) resolve(true);
          else mongoose.connection.once('connected', resolve);
        });
      }

      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('groups', '_id');
      if (!user || !user.isActive) return next(new Error('Authentication error: User not found or inactive'));

      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Authentication error'));
    }
  });

  // 2) Connection lifecycle
  io.on('connection', (socket: AuthenticatedSocket) => {
    const username = socket.user?.username || 'unknown';

    handleUserConnect(socket, io).finally(() => logConnectedUsers('CONNECT'));
    handleJoinGroups(socket);

    // ---------- Event wiring (with aliases) ----------

    // REMOVED: Direct chat event handlers
    // These events should now be sent only from the backend after proper processing
    // The client should use REST API calls instead of direct WebSocket emissions

    // REMOVED: Direct item update handlers
    // Item updates should now be handled only through REST API
    // The client should use REST API calls instead of direct WebSocket emissions

    // User status
    socket.on('user:status_changed', (data) => handleStatusUpdate(socket, io, data));
    socket.on('status:update', (data) => handleStatusUpdate(socket, io, data)); // alias
    socket.on('status_update', (data) => handleStatusUpdate(socket, io, data)); // alias

    // REMOVED: Direct group event handlers
    // These events should now be sent only from the backend after proper processing
    // The client should use REST API calls instead of direct WebSocket emissions

    // REMOVED: Direct item event handlers
    // These events should now be sent only from the backend after proper processing
    // The client should use REST API calls instead of direct WebSocket emissions

    // REMOVED: Direct chat typing event handlers
    // These events should now be sent only from the backend after proper processing
    // The client should use REST API calls instead of direct WebSocket emissions

    // Disconnect
    socket.on('disconnect', () => {
      handleUserDisconnect(socket, io).finally(() => logConnectedUsers('DISCONNECT'));
    });

    // Errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${username}:`, error);
    });
  });
};

// ---------------- Handlers ----------------

const handleUserConnect = async (socket: AuthenticatedSocket, io: Server): Promise<void> => {
  try {
    const userId = socket.userId!;
    const user = socket.user;

    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

    const userGroups = user.groups.map((g: any) => g._id.toString());

    const socketUser: ISocketUser = {
      userId,
      username: user.username,
      socketId: socket.id,
      groups: userGroups,
      status: 'online'
    };

    connectedUsers.set(socket.id, socketUser);
    userSockets.set(userId, socket.id);

    // notify online to the groups
    userGroups.forEach((groupId: string) => {
      socket.to(`group:${groupId}`).emit('user:status_changed', {
        userId,
        status: 'online',
        timestamp: new Date()
      });
    });

    // send list of currently-online users in same groups
    const onlineUsers = Array.from(connectedUsers.values())
      .filter(u => userGroups.some((gid: string) => u.groups.includes(gid)))
      .map(u => ({ userId: u.userId, username: u.username, status: u.status }));

    socket.emit('online_users', onlineUsers);
  } catch (err) {
    console.error('Error on user connect:', err);
  }
};

const handleUserDisconnect = async (socket: AuthenticatedSocket, io: Server): Promise<void> => {
  try {
    const userId = socket.userId!;
    const socketUser = connectedUsers.get(socket.id);
    if (!socketUser) return;

    connectedUsers.delete(socket.id);
    userSockets.delete(userId);

    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

    socketUser.groups.forEach(groupId => {
      socket.to(`group:${groupId}`).emit('user:status_changed', {
        userId,
        status: 'offline',
        timestamp: new Date()
      });
    });

  } catch (err) {
    console.error('Error on user disconnect:', err);
  }
};

const handleJoinGroups = (socket: AuthenticatedSocket): void => {
  try {
    const user = socket.user;
    const userGroups = user.groups.map((g: any) => g._id.toString());
    userGroups.forEach((groupId: string) => socket.join(`group:${groupId}`));
  } catch (err) {
    console.error('Error joining groups:', err);
  }
};


const handleStatusUpdate = (socket: AuthenticatedSocket, io: Server, data: any): void => {
  try {
    const { status, location } = data;
    const userId = socket.userId!;
    const socketUser = connectedUsers.get(socket.id);
    if (!socketUser) return;

    socketUser.status = status;
    if (location) socketUser.currentLocation = location;

    const statusUpdate: ISocketUserStatus = {
      userId,
      status,
      location,
      timestamp: new Date()
    };

    socketUser.groups.forEach(groupId => {
      socket.to(`group:${groupId}`).emit('user:status_changed', statusUpdate);
    });
  } catch (err) {
    console.error('Error handling status update:', err);
  }
};

export const getGroupUsers = (groupId: string): ISocketUser[] =>
  Array.from(connectedUsers.values()).filter(u => u.groups.includes(groupId));

export const getIO = (): Server | null => globalIO;

export const sendNotificationToUser = (io: Server, userId: string, notification: any): void => {
  const socketId = userSockets.get(userId);
  if (socketId) io.to(socketId).emit('notification', notification);
};

// helper: שדר לחדר קבוצה לכל המשתמשים *חוץ* ממשתמש אחד
export const emitToGroupExcept = (
  io: Server,
  groupId: string,
  excludeUserId: string,
  event: string,
  payload: any
) => {
  const room = `group:${groupId}`;
  const sid = userSockets.get(excludeUserId); // מזהה הסוקט של המבצע
  
  
  if (sid) {
    io.to(room).except(sid).emit(event, payload);
  } else {
    // אם אין socketId (edge case) — נשדר לכל החדר
    io.to(room).emit(event, payload);
  }
  
  // Debug: check room size
  const roomSockets = io.sockets.adapter.rooms.get(room);

  if (roomSockets) {
    Array.from(roomSockets);
  }
};

