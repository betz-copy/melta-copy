import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import ActivityLogController from './controller';
import { getActivitySchema } from './validator.schema';

const activityLogRouter: Router = Router();
const controller = createController(ActivityLogController);

activityLogRouter.get('/:entityId', ValidateRequest(getActivitySchema), controller.getActivity);

export default activityLogRouter;
