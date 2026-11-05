import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireReviewer } from '../middleware/rbac.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

// Viewing guidelines is open to all authenticated workspace members (creators, reviewers, admins)
router.get('/', DocumentController.getDocuments);
router.get('/:id', DocumentController.getDocumentById);

// Uploading and deleting official company brand guidelines requires reviewer or administrator role
router.post('/upload', requireReviewer, uploadMiddleware.single('file'), DocumentController.uploadDocument);
router.delete('/:id', requireReviewer, DocumentController.deleteDocument);

export default router;
