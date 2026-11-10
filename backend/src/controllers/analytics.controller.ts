import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  /**
   * Get organisation-level brand compliance metrics, recurring violations,
   * guideline gap detection, and governance policy recommendations.
   */
  public static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const metrics = await AnalyticsService.getOrganizationAnalytics(orgId);

      res.json({
        success: true,
        metrics,
      });
    } catch (err: any) {
      next(err);
    }
  }
}

