import { Router } from 'express';
import ActivityLogController from './controller';
import { createWorkspacesController } from '../../utils/express';

const ActivityLogRouter: Router = Router();

const InstancesControllerMiddleware = createWorkspacesController(ActivityLogController);

ActivityLogRouter.get('/:entityId', InstancesControllerMiddleware.getActivity);

export default ActivityLogRouter;
