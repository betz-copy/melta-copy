import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import ActivityLogController from './controller';
import { createActivityRequestSchema, getActivitySchema } from './validator.schema';

const activityLogRouter: Router = Router();

const controller = createController(ActivityLogController);

activityLogRouter.get('/:entityId', ValidateRequest(getActivitySchema), controller('getActivity'));
activityLogRouter.post('/', ValidateRequest(createActivityRequestSchema), controller('createActivity'));

export default activityLogRouter;
