import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { BrandDocument } from '../models/BrandDocument.js';
import { GuidelineChunk } from '../models/GuidelineChunk.js';
import { DocumentParserService } from '../services/documentParser.service.js';
import { EmbeddingService } from '../services/embedding.service.js';

export class DocumentController {
  /**
   * Upload and process a new brand guideline document (PDF or TXT).
   */
  public static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No document file provided. Please attach a valid .pdf or .txt file.',
        });
        return;
      }

      const file = req.file;
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const userId = new mongoose.Types.ObjectId(req.user!.id);
      const ext = path.extname(file.originalname).toLowerCase();
      const fileType = ext === '.pdf' ? 'pdf' : 'txt';

      // 1. Extract readable text safely
      let parsedResult;
      try {
        parsedResult = await DocumentParserService.extractText(file.buffer, fileType);
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: `Document processing failed: ${err.message}`,
        });
        return;
      }

      // 2. Chunk document text
      const chunks = DocumentParserService.chunkDocument(
        parsedResult.text,
        file.originalname.replace(/\.[^/.]+$/, ''),
        550,
        90
      );

      // 3. Create BrandDocument record in MongoDB
      const brandDoc = await BrandDocument.create({
        organizationId: orgId,
        uploadedBy: userId,
        filename: `${Date.now()}_${file.originalname}`,
        originalName: file.originalname,
        fileType,
        fileSize: file.size,
        extractedText: parsedResult.text,
        chunkCount: chunks.length,
        status: 'processing',
        isActive: true,
      });

      // 4. Generate embeddings and persist chunks
      const chunkDocs = [];
      for (const c of chunks) {
        const embedding = await EmbeddingService.generateEmbedding(c.content);
        chunkDocs.push({
          documentId: brandDoc._id,
          organizationId: orgId,
          chunkIndex: c.chunkIndex,
          content: c.content,
          embedding,
          metadata: {
            title: c.title,
            category: 'Brand Guidelines',
            charCount: c.charCount,
          },
          isActive: true,
        });
      }

      await GuidelineChunk.insertMany(chunkDocs);

      // 5. Mark document as processed
      brandDoc.status = 'processed';
      await brandDoc.save();

      res.status(201).json({
        success: true,
        message: `Successfully processed and indexed '${file.originalname}' (${chunks.length} guideline chunks generated).`,
        document: {
          id: brandDoc._id,
          originalName: brandDoc.originalName,
          fileType: brandDoc.fileType,
          fileSize: brandDoc.fileSize,
          chunkCount: brandDoc.chunkCount,
          status: brandDoc.status,
          createdAt: brandDoc.createdAt,
        },
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * List all active guidelines for the authenticated organization.
   */
  public static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const documents = await BrandDocument.find({
        organizationId: orgId,
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'name email role')
        .select('-extractedText');

      res.json({
        success: true,
        count: documents.length,
        documents,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Get single guideline details along with its chunks.
   */
  public static async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const doc = await BrandDocument.findOne({
        _id: id,
        organizationId: orgId,
        isActive: true,
      }).populate('uploadedBy', 'name email');

      if (!doc) {
        res.status(404).json({
          success: false,
          error: 'Brand guideline document not found.',
        });
        return;
      }

      const chunks = await GuidelineChunk.find({
        documentId: doc._id,
        organizationId: orgId,
        isActive: true,
      })
        .select('chunkIndex content metadata')
        .sort({ chunkIndex: 1 });

      res.json({
        success: true,
        document: doc,
        chunks,
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Remove/deactivate a guideline document and its chunks.
   * Excludes them immediately from all future analysis.
   */
  public static async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);

      const doc = await BrandDocument.findOne({
        _id: id,
        organizationId: orgId,
      });

      if (!doc) {
        res.status(404).json({
          success: false,
          error: 'Document not found or does not belong to your organisation.',
        });
        return;
      }

      // Soft delete doc and all associated chunks
      doc.isActive = false;
      await doc.save();

      await GuidelineChunk.updateMany(
        { documentId: doc._id, organizationId: orgId },
        { $set: { isActive: false } }
      );

      res.json({
        success: true,
        message: `Brand guideline '${doc.originalName}' has been removed and excluded from future analysis.`,
      });
    } catch (err: any) {
      next(err);
    }
  }
}
