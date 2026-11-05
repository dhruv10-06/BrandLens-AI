import { Router } from 'express';
import { FactController } from '../controllers/fact.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', FactController.createFact);
router.get('/', FactController.getFacts);
router.delete('/:id', FactController.deleteFact);

export default router;
