import { Router } from 'express';
import ActivityLogController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { getActivitySchema } from './validator.schema';

const activityLogRouter: Router = Router();

activityLogRouter.get('/:entityId', ValidateRequest(getActivitySchema), wrapController(ActivityLogController.getActivity));

export default activityLogRouter;
