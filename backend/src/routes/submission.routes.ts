import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller.js';
import { authenticate } from '../middleware/auth.js';
import { aiAnalysisLimiter } from '../middleware/rateLimiter.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/', aiAnalysisLimiter, SubmissionController.createSubmission);
router.post('/upload-draft-document', uploadMiddleware.single('file'), SubmissionController.uploadDraftDocument);
router.get('/', SubmissionController.getSubmissions);
router.get('/:id', SubmissionController.getSubmissionById);
router.patch('/:id/content', SubmissionController.updateContent);
router.post('/:id/reanalyze', aiAnalysisLimiter, SubmissionController.reanalyzeSubmission);
router.post('/:id/submit-for-review', SubmissionController.submitForReview);

export default router;

