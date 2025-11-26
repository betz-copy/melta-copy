import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import DashboardController from './controller';
import {
    createDashboardRequestSchema,
    deleteDashboardItemByRelatedItemRequestSchema,
    deleteDashboardItemRequestSchema,
    editDashboardItemRequestSchema,
    getDashboardItemByIdRequestSchema,
    getRelatedDashboardItemsRequestSchema,
    searchDashboardItemsRequestSchema,
} from './validator.schema';

const dashboardRouter: Router = Router();

const controller = createController(DashboardController);

dashboardRouter.get('/:dashboardItemId', ValidateRequest(getDashboardItemByIdRequestSchema), controller.getDashboardItemById);

dashboardRouter.post('/', ValidateRequest(createDashboardRequestSchema), controller.createDashboardItem);

dashboardRouter.post('/search', ValidateRequest(searchDashboardItemsRequestSchema), controller.searchDashboardItems);

dashboardRouter.post('/relatedItems', ValidateRequest(getRelatedDashboardItemsRequestSchema), controller.getDashboardRelatedItems);

dashboardRouter.put('/:dashboardItemId', ValidateRequest(editDashboardItemRequestSchema), controller.editDashboardItem);

dashboardRouter.delete('/:dashboardItemId', ValidateRequest(deleteDashboardItemRequestSchema), controller.deleteDashboardItem);

dashboardRouter.delete(
    '/relatedItem/:relatedId',
    ValidateRequest(deleteDashboardItemByRelatedItemRequestSchema),
    controller.deleteDashboardItemByRelatedItem,
);

export default dashboardRouter;
