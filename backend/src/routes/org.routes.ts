import { Router } from 'express';
import { OrgController } from '../controllers/org.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireReviewer } from '../middleware/rbac.js';

const router = Router();

router.get('/', authenticate, OrgController.getOrganization);

// Updating organization brand voice requires reviewer or admin role
router.patch('/brand-voice', authenticate, requireReviewer, OrgController.updateBrandVoice);

// Demo seed endpoint: strictly prohibited in production
router.post('/seed-demo', OrgController.seedDemo);

export default router;
