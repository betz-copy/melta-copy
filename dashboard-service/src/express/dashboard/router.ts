import { Router } from 'express';
import { createController } from '../../utils/express';
import DashboardController from './controller';

const dashboardRouter: Router = Router();

const controller = createController(DashboardController);

dashboardRouter.post('/', controller.createDashboardItem);

dashboardRouter.get('/:dashboardItemId', controller.getDashboardItemById);

export default dashboardRouter;
