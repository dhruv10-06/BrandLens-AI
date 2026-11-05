import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireReviewer } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/queue', requireReviewer, ReviewController.getReviewQueue);
router.post('/decision/:id', requireReviewer, ReviewController.makeDecision);
router.get('/history', ReviewController.getReviewHistory);

export default router;
