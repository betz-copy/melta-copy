import { Router } from 'express';
import { createWorkspacesController } from '../../utils/express';
import ActivityLogController from './controller';

const ActivityLogRouter: Router = Router();

const InstancesControllerMiddleware = createWorkspacesController(ActivityLogController);

ActivityLogRouter.get('/:entityId', InstancesControllerMiddleware.getActivity);

export default ActivityLogRouter;
