import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Organisation } from '../models/Organisation.js';
import { BrandDocument } from '../models/BrandDocument.js';
import { ApprovedFact } from '../models/ApprovedFact.js';
import { ContentSubmission } from '../models/ContentSubmission.js';
import { SeedService } from '../services/seed.service.js';

const UpdateVoiceSchema = z.object({
  brandVoiceSummary: z.string().min(5).max(2000),
  description: z.string().max(1000).optional(),
});

export class OrgController {
  public static async getOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const org = await Organisation.findById(orgId);

      if (!org) {
        res.status(404).json({ success: false, error: 'Organisation not found.' });
        return;
      }

      const [docsCount, factsCount, submissionsCount] = await Promise.all([
        BrandDocument.countDocuments({ organizationId: orgId, isActive: true }),
        ApprovedFact.countDocuments({ organizationId: orgId, isActive: true }),
        ContentSubmission.countDocuments({ organizationId: orgId }),
      ]);

      res.json({
        success: true,
        organization: org,
        stats: {
          documents: docsCount,
          factsAndRules: factsCount,
          submissions: submissionsCount,
        },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async updateBrandVoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { brandVoiceSummary, description } = UpdateVoiceSchema.parse(req.body);
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const org = await Organisation.findById(orgId);
      if (!org) {
        res.status(404).json({ success: false, error: 'Organisation not found.' });
        return;
      }

      org.brandVoiceSummary = brandVoiceSummary;
      if (description !== undefined) {
        org.description = description;
      }
      await org.save();

      res.json({
        success: true,
        message: 'Brand voice guidelines updated successfully.',
        organization: org,
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async seedDemo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { force } = req.body;
      const result = await SeedService.seedDemoData(!!force);
      res.json({
        success: true,
        message: 'Demo dataset initialized successfully.',
        data: result,
      });
    } catch (err: any) {
      next(err);
    }
  }
}
