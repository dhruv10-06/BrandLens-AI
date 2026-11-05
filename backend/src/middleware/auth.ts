import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User, IUser, UserRole } from '../models/User.js';
import mongoose from 'mongoose';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. No access token provided in request.',
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token. Please sign in again.',
      });
      return;
    }

    if (!decoded || !decoded.id || !decoded.organizationId) {
      res.status(401).json({
        success: false,
        error: 'Malformed token payload.',
      });
      return;
    }

    const user = await User.findById(decoded.id).select('-passwordHash').lean();
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'The user account associated with this token no longer exists.',
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId.toString(),
    };

    next();
  } catch (err: any) {
    next(err);
  }
}
