import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadMiddleware.single('file'), DocumentController.uploadDocument);
router.get('/', DocumentController.getDocuments);
router.get('/:id', DocumentController.getDocumentById);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
