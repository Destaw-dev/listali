import { Request, Response, NextFunction } from 'express';
import { Document, Types } from 'mongoose';
import User from '../models/user';
import { IApiResponse, IGroup, IGroupMember } from '../types';
import { verifyAccessToken } from '../utils/tokens';

export const authenticateToken = async (
  req: Request, 
  res: Response<IApiResponse<void>>, 
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    try {
      const decoded = verifyAccessToken(token);

      const user = await User.findById(decoded.sub).select('-password');
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Token is valid but user not found or inactive'
        });
        return;
      }

      user.lastSeen = new Date();
      await user.save();

      req.user = user;
      req.userId = user._id.toString();

      next();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          res.status(401).json({
            success: false,
            message: 'Token has expired'
          });
          return;
        }
        
        if (error.message.includes('Invalid')) {
          res.status(401).json({
            success: false,
            message: 'Invalid token'
          });
          return;
        }
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

export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.sub).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id.toString();
          
          user.lastSeen = new Date();
          await user.save();
        }
      } catch {
        // Token is invalid, but we continue without authentication
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};

export const checkGroupMembership = (permission?: string) => {
  return async (req: Request, res: Response<IApiResponse<void>>, next: NextFunction): Promise<void> => {
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

      const Group = (await import('../models/group')).default;
      
      const group = await Group.findById(groupId);

      
      if (!group || !group.isActive) {
        res.status(404).json({
          success: false,
          message: 'Group not found'
        });
        return;
      }

      const member = group.members.find(m => m.user.toString() === userId);
      
      if (!member) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this group.'
        });
        return;
      }

      if (permission && !group.hasPermission(userId, permission)) {
        res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to ${permission}.`
        });
        return;
      }

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

export const checkOwnership = (resourceType: 'group' | 'list' | 'item') => {
  return async (req: Request, res: Response<IApiResponse<void>>, next: NextFunction): Promise<void> => {
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
      let resource: Document | null = null;
      
      switch (resourceType) {
        case 'group': {
          resourceId = req.params.groupId || req.params.id;
          const Group = (await import('../models/group')).default;
          resource = await Group.findById(resourceId);
          break;
        }
        case 'list': {
          resourceId = req.params.listId || req.params.id;
          const ShoppingList = (await import('../models/shoppingList')).default;
          resource = await ShoppingList.findById(resourceId);
          break;
        }
        case 'item': {
          resourceId = req.params.itemId || req.params.id;
          const Item = (await import('../models/item')).default;
          resource = await Item.findById(resourceId);
          break;
        }
        default:
          res.status(400).json({
            success: false,
            message: 'Invalid resource type'
          });
          return;
      }
      
      if (!resource) {
        res.status(404).json({
          success: false,
          message: `${resourceType} not found`
        });
        return;
      }

      let isOwner = false;
      if (resourceType === 'group') {
        const groupResource = resource as IGroup;
        isOwner = groupResource.owner.toString() === userId;
      } else {
        if ('createdBy' in resource && resource.createdBy) {
          const createdBy = resource.createdBy as Types.ObjectId;
          isOwner = createdBy.toString() === userId;
        }
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

export const authRateLimit = {
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

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