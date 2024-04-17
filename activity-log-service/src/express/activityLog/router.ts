import { Router } from 'express';
import ActivityLogController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { getActivitySchema, createActivityRequestSchema } from './validator.schema';

const activityLogRouter: Router = Router();

activityLogRouter.get('/:entityId', ValidateRequest(getActivitySchema), wrapController(ActivityLogController.getActivity));
activityLogRouter.post('/', ValidateRequest(createActivityRequestSchema), wrapController(ActivityLogController.createActivity));

export default activityLogRouter;
