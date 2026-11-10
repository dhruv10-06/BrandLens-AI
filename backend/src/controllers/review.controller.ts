import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ContentSubmission } from '../models/ContentSubmission.js';
import { ReviewDecision } from '../models/ReviewDecision.js';
import { Organisation } from '../models/Organisation.js';
import { PublishingIntegrationService } from '../services/publishingIntegration.service.js';

const MakeDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'requested_changes']),
  comments: z.string().min(2, 'A review comment or justification is required').max(2000),
  publishChannel: z.enum(['webhook', 'cms', 'social_media', 'internal']).optional(),
  customWebhookUrl: z.string().url('Invalid webhook URL format').optional(),
});

export class ReviewController {
  /**
   * Get the queue of submissions awaiting brand governance review.
   */
  public static async getReviewQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const queue = await ContentSubmission.find({
        organizationId: orgId,
        status: { $in: ['pending_review', 'needs_changes'] },
      })
        .sort({ updatedAt: -1 })
        .populate('creatorId', 'name email')
        .populate('latestAnalysisId', 'overallComplianceScore status summary findings visualAnalysis');

      res.json({
        success: true,
        count: queue.length,
        queue,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Human reviewer submits an approval, rejection, or changes request.
   * Strictly enforced on the backend: creators cannot approve their own content.
   * On approval, executes verified publishing integrations (webhook, CMS, social) with full audit trail.
   */
  public static async makeDecision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { decision, comments, publishChannel, customWebhookUrl } = MakeDecisionSchema.parse(req.body);
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const reviewerId = new mongoose.Types.ObjectId(req.user!.id);

      const submission = await ContentSubmission.findOne({
        _id: id,
        organizationId: orgId,
      });

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found in your organisation.' });
        return;
      }

      // Security check: Creator cannot approve their own submission
      if (submission.creatorId.toString() === req.user!.id) {
        res.status(403).json({
          success: false,
          error: 'Separation of duties violation: Creators are not permitted to review or approve their own content.',
        });
        return;
      }

      // Record Review Decision
      const reviewRecord = await ReviewDecision.create({
        submissionId: submission._id,
        organizationId: orgId,
        reviewerId,
        decision,
        comments,
        reviewedContent: submission.currentContent,
      });

      // Update submission status
      let publishingResult: any = undefined;
      if (decision === 'approved') {
        submission.status = 'approved';

        // Execute verified publishing pipeline upon human reviewer approval
        const org = await Organisation.findById(orgId);
        if (org) {
          publishingResult = await PublishingIntegrationService.dispatchPublication(
            submission,
            org,
            reviewerId.toString(),
            publishChannel || 'internal',
            customWebhookUrl
          );

          submission.publishingDetails = {
            channel: publishingResult.channel,
            webhookUrl: customWebhookUrl || org.publishingWebhookUrl,
            status: publishingResult.success ? 'published' : 'failed',
            publishedAt: publishingResult.publishedAt,
            payloadPreview: publishingResult.payloadPreview,
            error: publishingResult.error,
          };
        }
      } else if (decision === 'rejected') {
        submission.status = 'rejected';
      } else if (decision === 'requested_changes') {
        submission.status = 'needs_changes';
      }

      await submission.save();

      res.json({
        success: true,
        message: `Content marked as ${decision.toUpperCase()} by reviewer.${publishingResult ? ` Publishing pipeline: ${publishingResult.destination} (${publishingResult.success ? 'dispatched' : 'error'}).` : ''}`,
        decision: reviewRecord,
        submission,
        publishingResult,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Preview publication payload before reviewer gives final approval.
   */
  public static async previewPublish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const [submission, org] = await Promise.all([
        ContentSubmission.findOne({ _id: id, organizationId: orgId }),
        Organisation.findById(orgId),
      ]);

      if (!submission || !org) {
        res.status(404).json({ success: false, error: 'Submission or Organisation not found.' });
        return;
      }

      const payload = PublishingIntegrationService.generatePayload(submission, org, req.user!.id);
      res.json({
        success: true,
        channel: org.publishingWebhookUrl ? 'webhook' : 'internal',
        webhookUrl: org.publishingWebhookUrl || null,
        payload,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Get full audit history of review decisions for a submission or the entire organisation.
   */
  public static async getReviewHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const { submissionId } = req.query;

      const query: any = { organizationId: orgId };
      if (submissionId) {
        query.submissionId = submissionId;
      }

      const history = await ReviewDecision.find(query)
        .sort({ createdAt: -1 })
        .populate('reviewerId', 'name email role')
        .populate('submissionId', 'title contentType status');

      res.json({
        success: true,
        count: history.length,
        history,
      });
    } catch (err: any) {
      next(err);
    }
  }
}

