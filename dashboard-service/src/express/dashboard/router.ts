import { Router } from 'express';
import { createController } from '../../utils/express';
import DashboardController from './controller';

const dashboardRouter: Router = Router();

const controller = createController(DashboardController);

dashboardRouter.post('/', controller.createDashboardItem);

dashboardRouter.get('/:dashboardItemId', controller.getDashboardItemById);

dashboardRouter.post('/relatedItems', controller.getDashboardRelatedItems);

dashboardRouter.put('/:dashboardItemId', controller.editDashboardItem);

dashboardRouter.delete('/:dashboardItemId', controller.deleteDashboardItem);

dashboardRouter.post('/search', controller.getChartsByTemplateId);

export default dashboardRouter;
