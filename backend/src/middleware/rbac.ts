import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required before checking permissions.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Your role '${req.user.role}' lacks permission for this action. Required role(s): [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
}

export const requireReviewer = requireRole(['reviewer', 'admin']);
export const requireCreator = requireRole(['creator', 'reviewer', 'admin']);

