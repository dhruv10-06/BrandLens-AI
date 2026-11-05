import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, UserRole } from '../models/User.js';
import { Organisation } from '../models/Organisation.js';
import { ENV, isProd } from '../config/env.js';

// Public registration strictly limits new users to 'creator' role to prevent privilege escalation
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(150),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  orgName: z.string().min(2, 'Organisation name must be at least 2 characters').max(100).optional(),
  orgSlug: z.string().min(2).max(100).optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, orgName, orgSlug } = RegisterSchema.parse(req.body);

      // Check if email already registered
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please log in.',
        });
        return;
      }

      // Check or create organisation
      let org;
      if (orgSlug) {
        org = await Organisation.findOne({ slug: orgSlug.toLowerCase() });
      }

      if (!org) {
        const generatedSlug = (orgSlug || orgName || 'my-org')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-');

        org = await Organisation.findOne({ slug: generatedSlug });
        if (!org) {
          org = await Organisation.create({
            name: orgName || 'Default Organisation',
            slug: generatedSlug,
            description: `Brand workspace for ${orgName || 'BrandLens AI'}`,
          });
        }
      }

      // Hash password securely
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Enforce: Public registrations ALWAYS receive 'creator' role.
      // Reviewers are provisioned strictly via administrative processes.
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'creator' as UserRole,
        organizationId: org._id,
      });

      // Issue JWT
      const token = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          organizationId: org._id.toString(),
        },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      // Set HttpOnly Cookie
      res.cookie('token', token, COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: {
            id: org._id,
            name: org.name,
            slug: org.slug,
          },
        },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = LoginSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        });
        return;
      }

      const org = await Organisation.findById(user.organizationId);

      const token = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          organizationId: user.organizationId.toString(),
        },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      // Set HttpOnly Cookie
      res.cookie('token', token, COOKIE_OPTIONS);

      res.json({
        success: true,
        message: 'Sign in successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: org
            ? {
                id: org._id,
                name: org.name,
                slug: org.slug,
              }
            : null,
        },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token', COOKIE_OPTIONS);
    res.json({
      success: true,
      message: 'Signed out successfully.',
    });
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated.' });
        return;
      }

      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const org = await Organisation.findById(user.organizationId);

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: org
            ? {
                id: org._id,
                name: org.name,
                slug: org.slug,
                brandVoiceSummary: org.brandVoiceSummary,
              }
            : null,
        },
      });
    } catch (err: any) {
      next(err);
    }
  }
}
