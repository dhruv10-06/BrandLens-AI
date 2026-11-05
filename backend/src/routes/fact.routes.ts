import { Router } from 'express';
import { FactController } from '../controllers/fact.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireReviewer } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// Viewing approved facts and terminology is accessible to all members
router.get('/', FactController.getFacts);

// Modifying official brand terminology, prohibited words, and tone rules requires reviewer role
router.post('/', requireReviewer, FactController.createFact);
router.delete('/:id', requireReviewer, FactController.deleteFact);

export default router;
