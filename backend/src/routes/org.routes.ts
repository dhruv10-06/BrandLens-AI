import { Router } from 'express';
import { OrgController } from '../controllers/org.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, OrgController.getOrganization);
router.patch('/brand-voice', authenticate, OrgController.updateBrandVoice);
router.post('/seed-demo', OrgController.seedDemo);

export default router;
