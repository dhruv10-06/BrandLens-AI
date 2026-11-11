import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ContentSubmission, ContentType, SubmissionFormat } from '../models/ContentSubmission.js';
import { AnalysisReport } from '../models/AnalysisReport.js';
import { Organisation } from '../models/Organisation.js';
import { RAGService } from '../services/rag.service.js';
import { AnalysisService } from '../services/analysis.service.js';
import { VisualAnalysisService } from '../services/visualAnalysis.service.js';
import { DocumentParserService } from '../services/documentParser.service.js';

const VisualAssetSchema = z.object({
  filename: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().max(10 * 1024 * 1024, 'Image size exceeds 10MB limit'),
  dataUrl: z.string().min(10),
  dimensions: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
});

const CreateSubmissionSchema = z
  .object({
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
    submissionFormat: z.enum(['text', 'document', 'image', 'multi_format']).default('text'),
    content: z.string().max(25000, 'Content must not exceed 25,000 characters').optional().default(''),
    visualAsset: VisualAssetSchema.optional(),
  })
  .refine(
    (data) => {
      const hasContent = Boolean(data.content && data.content.trim().length >= 5);
      const hasVisual = Boolean(data.visualAsset && data.visualAsset.dataUrl);
      return hasContent || hasVisual;
    },
    {
      message: 'Either written content (at least 5 characters) or a visual creative asset must be provided.',
      path: ['content'],
    }
  );

const UpdateContentSchema = z.object({
  content: z.string().min(5, 'Content must be at least 5 characters').max(25000),
  reason: z.string().max(300).optional(),
});

export class SubmissionController {
  /**
   * Submit new content (text, document-extracted copy, visual creative, or multi-format campaign)
   * and immediately trigger comprehensive brand governance analysis.
   */
  public static async createSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, contentType, submissionFormat, content, visualAsset } = CreateSubmissionSchema.parse(req.body);
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const userId = new mongoose.Types.ObjectId(req.user!.id);

      const org = await Organisation.findById(orgId);
      if (!org) {
        res.status(404).json({ success: false, error: 'Organisation not found.' });
        return;
      }

      const safeContent = content && content.trim().length >= 5
        ? content.trim()
        : visualAsset
        ? `[Visual Creative Asset: ${visualAsset.filename}]`
        : '';

      const detectedFormat: SubmissionFormat =
        submissionFormat || (visualAsset && content && content.trim().length >= 5
          ? 'multi_format'
          : visualAsset
          ? 'image'
          : 'text');

      // 1. Create submission record in 'analysing' state
      const submission = await ContentSubmission.create({
        organizationId: orgId,
        creatorId: userId,
        title,
        contentType: contentType as ContentType,
        submissionFormat: detectedFormat,
        originalContent: safeContent,
        currentContent: safeContent,
        visualAsset: visualAsset || undefined,
        status: 'analysing',
        version: 1,
        contentHistory: [
          {
            content: safeContent,
            modifiedAt: new Date(),
            reason: 'Initial creation',
          },
        ],
      });

      try {
        // 2. Execute RAG Retrieval & Written Content Analysis
        const ragResult = await RAGService.retrieveRelevantKnowledge(orgId, safeContent, 6);
        const analysisOutput = await AnalysisService.analyzeContent(
          safeContent,
          contentType,
          title,
          ragResult
        );

        // 3. Execute Multimodal Visual Compliance Analysis if creative is attached
        let visualResult: any = undefined;
        if (visualAsset && visualAsset.dataUrl) {
          visualResult = await VisualAnalysisService.analyzeImage(
            visualAsset.dataUrl,
            visualAsset.fileType,
            org,
            title,
            safeContent
          );
        }

        // 4. Calculate Combined Overall Score
        let finalScore = analysisOutput.overallComplianceScore;
        let finalStatus = analysisOutput.status;

        if (visualResult && content && content.trim().length >= 5) {
          // Weighted composite score: 55% copy compliance, 45% visual brand compliance
          finalScore = Math.round(analysisOutput.overallComplianceScore * 0.55 + visualResult.overallVisualScore * 0.45);
        } else if (visualResult && (!content || content.trim().length < 5)) {
          finalScore = visualResult.overallVisualScore;
        }

        const hasViolations =
          analysisOutput.findings.length > 0 || (visualResult && visualResult.visualFindings?.length > 0);

        finalStatus =
          finalScore >= 90 && !hasViolations
            ? 'passed'
            : finalScore >= 70
            ? 'warning'
            : 'violations_found';

        const compositeSummary = visualResult
          ? `${analysisOutput.summary} Visual Audit: ${visualResult.summary}`
          : analysisOutput.summary;

        // 5. Save Analysis Report
        const report = await AnalysisReport.create({
          submissionId: submission._id,
          organizationId: orgId,
          analyzedContent: safeContent,
          overallComplianceScore: finalScore,
          status: finalStatus,
          summary: compositeSummary,
          findings: analysisOutput.findings,
          visualAnalysis: visualResult ? {
            overallVisualScore: visualResult.overallVisualScore,
            detectedColors: visualResult.detectedColors || [],
            logoAnalysis: visualResult.logoAnalysis,
            typographyAnalysis: visualResult.typographyAnalysis,
            visualFindings: visualResult.visualFindings || [],
          } : undefined,
          retrievedChunkIds: ragResult.guidelineChunkIds,
          aiModelUsed: visualResult ? `${AnalysisService.MODEL_NAME}-multimodal` : (analysisOutput.aiModelUsed || AnalysisService.MODEL_NAME),
        });

        // 6. Update submission status based on findings
        const newStatus =
          !hasViolations || finalScore >= 90
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
      } catch (analysisErr: any) {
        // Fallback: If AI analysis fails, mark submission as 'draft' rather than leaving stuck in 'analysing'
        submission.status = 'draft';
        await submission.save();
        res.status(201).json({
          success: true,
          message: 'Content submission saved as draft. AI analysis is temporarily unavailable; click "Re-Analyze" to retry.',
          submission,
          analysis: null,
          warning: analysisErr?.message || 'AI analysis could not complete immediately.',
        });
      }
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Upload and extract copy from draft document files (.pdf, .txt).
   * Enables seamless document-based submission workflow.
   */
  public static async uploadDraftDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No document file uploaded.' });
        return;
      }

      const ext = req.file.originalname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt';
      const parsed = await DocumentParserService.extractText(req.file.buffer, ext);

      res.json({
        success: true,
        filename: req.file.originalname,
        fileType: ext,
        extractedText: parsed.text,
        charCount: parsed.charCount,
        pageCount: parsed.pageCount,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Reconciles submissions that are stuck in 'analysing' state due to
   * transient network interruptions or unhandled errors during previous analysis calls.
   */
  private static async reconcileStuckSubmission(submission: any): Promise<any> {
    if (submission.status !== 'analysing') {
      return submission;
    }

    // Check if an analysis report exists
    let report: any = submission.latestAnalysisId;
    if (!report || !report._id) {
      report = await AnalysisReport.findOne({ submissionId: submission._id }).sort({ createdAt: -1 });
    }

    if (report) {
      const hasViolations =
        (report.findings && report.findings.length > 0) ||
        (report.visualAnalysis?.visualFindings && report.visualAnalysis.visualFindings.length > 0);
      const score = report.overallComplianceScore ?? 0;
      const reconciledStatus = (!hasViolations || score >= 90) ? 'pending_review' : 'needs_changes';

      await ContentSubmission.updateOne(
        { _id: submission._id },
        {
          $set: {
            status: reconciledStatus,
            latestAnalysisId: report._id || report,
          },
        }
      );
      submission.status = reconciledStatus;
      if (!submission.latestAnalysisId) {
        submission.latestAnalysisId = report;
      }
    } else {
      // No report found. If submission was created/updated > 30 seconds ago, it is stuck
      const lastModified = submission.updatedAt ? new Date(submission.updatedAt).getTime() : 0;
      const ageMs = Date.now() - lastModified;
      if (ageMs > 30000) {
        await ContentSubmission.updateOne(
          { _id: submission._id },
          { $set: { status: 'draft' } }
        );
        submission.status = 'draft';
      }
    }

    return submission;
  }

  /**
   * List all submissions for the organization.
   */
  public static async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const { status, contentType } = req.query;

      // Proactively reconcile any submissions stuck in 'analysing'
      const stuckSubs = await ContentSubmission.find({
        organizationId: orgId,
        status: 'analysing',
      });
      for (const stuck of stuckSubs) {
        await SubmissionController.reconcileStuckSubmission(stuck);
      }

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

      let submission = await ContentSubmission.findOne({
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

      if (submission.status === 'analysing') {
        await SubmissionController.reconcileStuckSubmission(submission);
        submission = await ContentSubmission.findOne({
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

      const previousStatus = submission.status;
      submission.status = 'analysing';
      await submission.save();

      try {
        // Run RAG and AI Analysis on updated current content
        const ragResult = await RAGService.retrieveRelevantKnowledge(orgId, submission.currentContent, 6);
        const analysisOutput = await AnalysisService.analyzeContent(
          submission.currentContent,
          submission.contentType,
          submission.title,
          ragResult
        );

        // Re-run visual analysis if submission has an attached visual asset
        let visualResult: any = undefined;
        if (submission.visualAsset && submission.visualAsset.dataUrl) {
          const org = await Organisation.findById(orgId);
          if (org) {
            visualResult = await VisualAnalysisService.analyzeImage(
              submission.visualAsset.dataUrl,
              submission.visualAsset.fileType,
              org,
              submission.title,
              submission.currentContent
            );
          }
        }

        let finalScore = analysisOutput.overallComplianceScore;
        if (visualResult && submission.currentContent && submission.currentContent.trim().length >= 5) {
          finalScore = Math.round(analysisOutput.overallComplianceScore * 0.55 + visualResult.overallVisualScore * 0.45);
        } else if (visualResult && (!submission.currentContent || submission.currentContent.trim().length < 5)) {
          finalScore = visualResult.overallVisualScore;
        }

        const hasViolations =
          analysisOutput.findings.length > 0 || (visualResult && visualResult.visualFindings?.length > 0);

        const finalStatus =
          finalScore >= 90 && !hasViolations
            ? 'passed'
            : finalScore >= 70
            ? 'warning'
            : 'violations_found';

        const compositeSummary = visualResult
          ? `${analysisOutput.summary} Visual Audit: ${visualResult.summary}`
          : analysisOutput.summary;

        const report = await AnalysisReport.create({
          submissionId: submission._id,
          organizationId: orgId,
          analyzedContent: submission.currentContent,
          overallComplianceScore: finalScore,
          status: finalStatus,
          summary: compositeSummary,
          findings: analysisOutput.findings,
          visualAnalysis: visualResult ? {
            overallVisualScore: visualResult.overallVisualScore,
            detectedColors: visualResult.detectedColors || [],
            logoAnalysis: visualResult.logoAnalysis,
            typographyAnalysis: visualResult.typographyAnalysis,
            visualFindings: visualResult.visualFindings || [],
          } : undefined,
          retrievedChunkIds: ragResult.guidelineChunkIds,
          aiModelUsed: visualResult ? `${AnalysisService.MODEL_NAME}-multimodal` : (analysisOutput.aiModelUsed || AnalysisService.MODEL_NAME),
        });

        const newStatus =
          !hasViolations || finalScore >= 90
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
      } catch (analysisErr: any) {
        // If re-analysis fails, restore previous status so submission is not stuck in 'analysing'
        submission.status = previousStatus !== 'analysing' ? previousStatus : 'needs_changes';
        await submission.save();
        res.status(500).json({
          success: false,
          error: `Re-analysis failed: ${analysisErr.message || 'AI service error'}. Submission restored to ${submission.status}.`,
        });
      }
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
