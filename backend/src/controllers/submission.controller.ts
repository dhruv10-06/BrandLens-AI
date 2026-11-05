import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ContentSubmission, ContentType } from '../models/ContentSubmission.js';
import { AnalysisReport } from '../models/AnalysisReport.js';
import { RAGService } from '../services/rag.service.js';
import { AnalysisService } from '../services/analysis.service.js';

const CreateSubmissionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  contentType: z.enum([
    'social_media',
    'blog',
    'email',
    'advertisement',
    'press_release',
    'product_copy',
    'other',
  ]),
  content: z
    .string()
    .min(5, 'Content must be at least 5 characters')
    .max(25000, 'Content must not exceed 25,000 characters'),
});

const UpdateContentSchema = z.object({
  content: z.string().min(5, 'Content must be at least 5 characters').max(25000),
  reason: z.string().max(300).optional(),
});

export class SubmissionController {
  /**
   * Submit new content and immediately trigger RAG-based AI brand analysis.
   */
  public static async createSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, contentType, content } = CreateSubmissionSchema.parse(req.body);
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const userId = new mongoose.Types.ObjectId(req.user!.id);

      // 1. Create submission record in 'analysing' state
      const submission = await ContentSubmission.create({
        organizationId: orgId,
        creatorId: userId,
        title,
        contentType: contentType as ContentType,
        originalContent: content,
        currentContent: content,
        status: 'analysing',
        version: 1,
        contentHistory: [
          {
            content,
            modifiedAt: new Date(),
            reason: 'Initial creation',
          },
        ],
      });

      // 2. Execute RAG Retrieval
      const ragResult = await RAGService.retrieveRelevantKnowledge(orgId, content, 6);

      // 3. Execute AI Evaluation
      const analysisOutput = await AnalysisService.analyzeContent(
        content,
        contentType,
        title,
        ragResult
      );

      // 4. Save Analysis Report
      const report = await AnalysisReport.create({
        submissionId: submission._id,
        organizationId: orgId,
        analyzedContent: content,
        overallComplianceScore: analysisOutput.overallComplianceScore,
        status: analysisOutput.status,
        summary: analysisOutput.summary,
        findings: analysisOutput.findings,
        retrievedChunkIds: ragResult.guidelineChunkIds,
        aiModelUsed: analysisOutput.aiModelUsed || 'gemini-2.5-flash',
      });

      // 5. Update submission status based on findings
      const newStatus =
        analysisOutput.findings.length === 0 || analysisOutput.overallComplianceScore >= 90
          ? 'pending_review'
          : 'needs_changes';

      submission.status = newStatus;
      submission.latestAnalysisId = report._id as mongoose.Types.ObjectId;
      await submission.save();

      res.status(201).json({
        success: true,
        message: 'Content submitted and analyzed successfully.',
        submission,
        analysis: report,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * List all submissions for the organization.
   */
  public static async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const { status, contentType } = req.query;

      const query: any = { organizationId: orgId };
      if (status && status !== 'all') {
        query.status = status;
      }
      if (contentType && contentType !== 'all') {
        query.contentType = contentType;
      }

      const submissions = await ContentSubmission.find(query)
        .sort({ updatedAt: -1 })
        .populate('creatorId', 'name email role')
        .populate('latestAnalysisId', 'overallComplianceScore status summary findings aiModelUsed');

      res.json({
        success: true,
        count: submissions.length,
        submissions,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Get submission by ID with full analysis and history.
   */
  public static async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const submission = await ContentSubmission.findOne({
        _id: id,
        organizationId: orgId,
      })
        .populate('creatorId', 'name email role')
        .populate({
          path: 'latestAnalysisId',
          populate: {
            path: 'retrievedChunkIds',
            select: 'chunkIndex content metadata',
          },
        });

      if (!submission) {
        res.status(404).json({
          success: false,
          error: 'Content submission not found or does not belong to your organisation.',
        });
        return;
      }

      res.json({
        success: true,
        submission,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Update content (e.g. after user applies corrections or manually edits)
   * Strictly enforces ownership: Creators can only modify their own submissions.
   */
  public static async updateContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { content, reason } = UpdateContentSchema.parse(req.body);
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const submission = await ContentSubmission.findOne({
        _id: id,
        organizationId: orgId,
      });

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found in your organisation.' });
        return;
      }

      // Ownership enforcement
      if (req.user!.role === 'creator' && submission.creatorId.toString() !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only edit your own content submissions.',
        });
        return;
      }

      if (submission.status === 'approved') {
        res.status(400).json({
          success: false,
          error: 'Approved content cannot be modified. Create a new submission if revised content is needed.',
        });
        return;
      }

      submission.currentContent = content;
      submission.version += 1;
      submission.contentHistory.push({
        content,
        modifiedAt: new Date(),
        reason: reason || 'Applied suggested brand correction',
      });

      await submission.save();

      res.json({
        success: true,
        message: 'Content updated successfully.',
        submission,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Re-analyze content after corrections have been applied.
   * Strictly enforces ownership: Creators can only re-analyze their own submissions.
   */
  public static async reanalyzeSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const submission = await ContentSubmission.findOne({
        _id: id,
        organizationId: orgId,
      });

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found in your organisation.' });
        return;
      }

      // Ownership enforcement
      if (req.user!.role === 'creator' && submission.creatorId.toString() !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only re-analyze your own content submissions.',
        });
        return;
      }

      submission.status = 'analysing';
      await submission.save();

      // Run RAG and AI Analysis on updated current content
      const ragResult = await RAGService.retrieveRelevantKnowledge(orgId, submission.currentContent, 6);
      const analysisOutput = await AnalysisService.analyzeContent(
        submission.currentContent,
        submission.contentType,
        submission.title,
        ragResult
      );

      const report = await AnalysisReport.create({
        submissionId: submission._id,
        organizationId: orgId,
        analyzedContent: submission.currentContent,
        overallComplianceScore: analysisOutput.overallComplianceScore,
        status: analysisOutput.status,
        summary: analysisOutput.summary,
        findings: analysisOutput.findings,
        retrievedChunkIds: ragResult.guidelineChunkIds,
        aiModelUsed: analysisOutput.aiModelUsed || 'gemini-2.5-flash',
      });

      const newStatus =
        analysisOutput.findings.length === 0 || analysisOutput.overallComplianceScore >= 90
          ? 'pending_review'
          : 'needs_changes';

      submission.status = newStatus;
      submission.latestAnalysisId = report._id as mongoose.Types.ObjectId;
      await submission.save();

      res.json({
        success: true,
        message: 'Content re-analyzed successfully.',
        submission,
        analysis: report,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Creator submits the reviewed/fixed content to the reviewer queue.
   * Strictly enforces ownership: Creators can only submit their own submissions.
   */
  public static async submitForReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const submission = await ContentSubmission.findOne({
        _id: id,
        organizationId: orgId,
      });

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found in your organisation.' });
        return;
      }

      // Ownership enforcement
      if (req.user!.role === 'creator' && submission.creatorId.toString() !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only submit your own content for review.',
        });
        return;
      }

      submission.status = 'pending_review';
      await submission.save();

      res.json({
        success: true,
        message: 'Content submitted to the Brand Review Queue for final sign-off.',
        submission,
      });
    } catch (err: any) {
      next(err);
    }
  }
}
