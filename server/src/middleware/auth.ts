import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { IApiResponse, IGroup, IGroupMember } from '../types';

interface JwtPayload {
  id: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

// Authenticate token middleware
export const authenticateToken = async (
  req: Request, 
  res: Response<IApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'fallback-secret'
      ) as JwtPayload;

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Token is valid but user not found or inactive'
        });
        return;
      }

      // Update last seen
      user.lastSeen = new Date();
      await user.save();

      // Attach user to request
      req.user = user;
      req.userId = user._id.toString();

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
        return;
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        // Token is malformed or invalid, return 401 without logging
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'fallback-secret'
        ) as JwtPayload;

        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id.toString();
          
          // Update last seen
          user.lastSeen = new Date();
          await user.save();
        }
      } catch (error) {
        // Token is invalid, but we continue without authentication
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};

// Check if user is group member middleware
export const checkGroupMembership = (permission?: string) => {
  return async (req: Request, res: Response<IApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const { groupId } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!groupId) {
        res.status(400).json({
          success: false,
          message: 'Group ID is required'
        });
        return;
      }

      // Import Group model here to avoid circular dependency
      const Group = (await import('../models/group')).default;
      
      const group = await Group.findById(groupId);

      
      if (!group || !group.isActive) {
        res.status(404).json({
          success: false,
          message: 'Group not found'
        });
        return;
      }

      // Check if user is a member
      const member = group.members.find(m => m.user.toString() === userId);
      
      if (!member) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this group.'
        });
        return;
      }

      // Check specific permission if required
      if (permission && !group.hasPermission(userId, permission)) {
        res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to ${permission}.`
        });
        return;
      }

      // Attach group and member info to request
      req.group = group;
      req.groupMember = member;

      next();
    } catch (error) {
      console.error('Group membership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during group membership verification'
      });
    }
  };
};

// Check if user owns the resource
export const checkOwnership = (resourceType: 'group' | 'list' | 'item') => {
  return async (req: Request, res: Response<IApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      let resourceId: string | undefined;
      let Model: any;
      
      switch (resourceType) {
        case 'group':
          resourceId = req.params.groupId || req.params.id;
          Model = (await import('../models/group')).default;
          break;
        case 'list':
          resourceId = req.params.listId || req.params.id;
          Model = (await import('../models/shoppingList')).default;
          break;
        case 'item':
          resourceId = req.params.itemId || req.params.id;
          Model = (await import('../models/item')).default;
          break;
        default:
          res.status(400).json({
            success: false,
            message: 'Invalid resource type'
          });
          return;
      }

      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        res.status(404).json({
          success: false,
          message: `${resourceType} not found`
        });
        return;
      }

      // Check ownership based on resource type
      let isOwner = false;
      if (resourceType === 'group') {
        isOwner = resource.owner.toString() === userId;
      } else {
        isOwner = resource.createdBy.toString() === userId;
      }

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: `Access denied. You don't own this ${resourceType}.`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership verification'
      });
    }
  };
};

// Rate limiting for authentication endpoints
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Extend Express Request interface
// Using declare global for Express namespace extension (required by Express types)
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      group?: IGroup;
      groupMember?: IGroupMember;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */