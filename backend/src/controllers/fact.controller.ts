import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ApprovedFact, FactType } from '../models/ApprovedFact.js';

const FactSchema = z.object({
  type: z.enum(['fact', 'approved_terminology', 'prohibited_terminology', 'tone_rule']),
  key: z.string().min(1, 'Key or term name is required').max(200),
  value: z.string().min(1, 'Value, rule description or replacement is required').max(1000),
  context: z.string().max(500).optional(),
});

export class FactController {
  public static async createFact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = FactSchema.parse(req.body);
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const userId = new mongoose.Types.ObjectId(req.user!.id);

      const fact = await ApprovedFact.create({
        organizationId: orgId,
        createdBy: userId,
        type: data.type as FactType,
        key: data.key,
        value: data.value,
        context: data.context || '',
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: 'Brand governance rule/fact created successfully.',
        fact,
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async getFacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const { type } = req.query;

      const query: any = { organizationId: orgId, isActive: true };
      if (type && type !== 'all') {
        query.type = type;
      }

      const facts = await ApprovedFact.find(query)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email');

      res.json({
        success: true,
        count: facts.length,
        facts,
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async deleteFact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const fact = await ApprovedFact.findOne({
        _id: id,
        organizationId: orgId,
      });

      if (!fact) {
        res.status(404).json({ success: false, error: 'Brand fact/rule not found.' });
        return;
      }

      fact.isActive = false;
      await fact.save();

      res.json({
        success: true,
        message: 'Brand fact/rule removed successfully.',
      });
    } catch (err: any) {
      next(err);
    }
  }
}
