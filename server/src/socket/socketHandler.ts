import { Server, Socket } from 'socket.io';
import mongoose, { Types } from 'mongoose';
import User from '../models/user';
import { IGroup, ISocketUser, ISocketUserStatus, ISocketNotification, ISocketPayload } from '../types';
import { verifyAccessToken } from '../utils/tokens';

let globalIO: Server | null = null;

const connectedUsers = new Map<string, ISocketUser>();
const userSockets = new Map<string, string>();

interface SocketUserData {
  _id: Types.ObjectId;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  groups: Array<{ _id: Types.ObjectId }>;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: SocketUserData;
}

// For debug: log all connected users per connection/disconnection
function logConnectedUsers(_where: string) {
  // Uncomment if needed for debugging
  // const list = Array.from(connectedUsers.values()).map(u => ({
  //   userId: u.userId,
  //   username: u.username,
  //   socketId: u.socketId,
  //   groups: u.groups,
  //   status: u.status
  // }));
}

export const initializeSocket = (io: Server): void => {

  globalIO = io;
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication error: No token provided'));

      const decoded = verifyAccessToken(token);

      if (mongoose.connection.readyState !== 1) {
        await new Promise((resolve) => {
          if (mongoose.connection.readyState === 1) resolve(true);
          else mongoose.connection.once('connected', resolve);
        });
      }

      const user = await User.findById(decoded.sub)
        .select('-password')
        .populate('groups', '_id');
      if (!user || !user.isActive) return next(new Error('Authentication error: User not found or inactive'));

      socket.userId = user._id.toString();
      const userGroups = (user.groups || []) as Array<string | IGroup>;
      const populatedGroups = userGroups
        .filter((g): g is IGroup => typeof g === 'object' && g !== null && typeof g !== 'string' && '_id' in g)
        .map((g: IGroup) => ({ _id: g._id }));
      socket.user = {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive ? true : false,
        groups: populatedGroups
      };

      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const username = socket.user?.username || 'unknown';

    handleUserConnect(socket, io).finally(() => logConnectedUsers('CONNECT'));
    handleJoinGroups(socket);

    socket.on('user:status_changed', (data) => handleStatusUpdate(socket, io, data));
    socket.on('status:update', (data) => handleStatusUpdate(socket, io, data));
    socket.on('status_update', (data) => handleStatusUpdate(socket, io, data));

    socket.on('disconnect', () => {
      handleUserDisconnect(socket, io).finally(() => logConnectedUsers('DISCONNECT'));
    });

    socket.on('error', (error) => {
      console.error(`Socket error for user ${username}:`, error);
    });
  });
};


const handleUserConnect = async (socket: AuthenticatedSocket, _io: Server): Promise<void> => {
  try {
    const userId = socket.userId!;
    const user = socket.user;
    
    if (!user) {
      console.error('User not found in socket');
      return;
    }

    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

    const userGroups = user.groups.map(g => g._id.toString());

    const socketUser: ISocketUser = {
      userId,
      username: user.username,
      socketId: socket.id,
      groups: userGroups,
      status: 'online'
    };

    connectedUsers.set(socket.id, socketUser);
    userSockets.set(userId, socket.id);

    userGroups.forEach((groupId: string) => {
      socket.to(`group:${groupId}`).emit('user:status_changed', {
        userId,
        status: 'online',
        timestamp: new Date()
      });
    });

    const onlineUsers = Array.from(connectedUsers.values())
      .filter(u => userGroups.some((gid: string) => u.groups.includes(gid)))
      .map(u => ({ userId: u.userId, username: u.username, status: u.status }));

    socket.emit('online_users', onlineUsers);
  } catch (err) {
    console.error('Error on user connect:', err);
  }
};

const handleUserDisconnect = async (socket: AuthenticatedSocket, _io: Server): Promise<void> => {
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
    if (!user) {
      console.error('User not found in socket');
      return;
    }
    const userGroups = user.groups.map(g => g._id.toString());
    userGroups.forEach((groupId: string) => socket.join(`group:${groupId}`));
  } catch (err) {
    console.error('Error joining groups:', err);
  }
};


const handleStatusUpdate = (socket: AuthenticatedSocket, io: Server, data: ISocketUserStatus): void => {
  try {
    const { status, location } = data;
    const userId = socket.userId!;
    const socketUser = connectedUsers.get(socket.id);
    if (!socketUser) return;

    socketUser.status = status;
    if (location) {
      socketUser.currentLocation = location;
    }

    const statusUpdate: ISocketUserStatus = {
      userId,
      status,
      ...(location ? { location } : {}),
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

export const sendNotificationToUser = (io: Server, userId: string, notification: ISocketNotification): void => {
  const socketId = userSockets.get(userId);
  if (socketId) io.to(socketId).emit('notification', notification);
};

export const emitToGroupExcept = (
  io: Server,
  groupId: string,
  excludeUserId: string,
  event: string,
  payload: ISocketPayload
) => {
  const room = `group:${groupId}`;
  const sid = userSockets.get(excludeUserId);
  
  
  if (sid) {
    io.to(room).except(sid).emit(event, payload);
  } else {
    io.to(room).emit(event, payload);
  }
  
  // Debug: check room size
  const roomSockets = io.sockets.adapter.rooms.get(room);

  if (roomSockets) {
    Array.from(roomSockets);
  }
};

