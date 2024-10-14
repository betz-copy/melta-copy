import { Router } from 'express';
import { createFeatureFlag, getFeatureFlags, updateFeatureFlag, deleteFeatureFlag } from './controller';

const router = Router();

router.post('/configs', createFeatureFlag);

router.get('/configs/:workspaceId', getFeatureFlags);

router.put('/configs/:id', updateFeatureFlag);

router.delete('/configs/:id', deleteFeatureFlag);

export default router;
