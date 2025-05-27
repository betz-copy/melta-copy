import { Router } from 'express';
import { createController } from '../../utils/express';
import DashboardController from './controller';

const dashboardRouter: Router = Router();

const controller = createController(DashboardController);

dashboardRouter.get('/:dashboardItemId', controller.getDashboardItemById);

dashboardRouter.post('/', controller.createDashboardItem);

dashboardRouter.post('/search', controller.getChartsByTemplateId);

dashboardRouter.post('/relatedItems', controller.getDashboardRelatedItems);

dashboardRouter.put('/:dashboardItemId', controller.editDashboardItem);

dashboardRouter.delete('/:dashboardItemId', controller.deleteDashboardItem);

dashboardRouter.delete('/relatedItem/:relatedId', controller.deleteDashboardItemByRelatedItem);

export default dashboardRouter;
