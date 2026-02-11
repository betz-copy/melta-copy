import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import ChartController from './controller';
import {
    createChartRequestSchema,
    deleteChartRequestSchema,
    getChartByIdRequestSchema,
    getChartByTemplateIdRequestSchema,
    updateChartRequestSchema,
} from './validator.schema';

const chartsRouter: Router = Router();

const controller = createController(ChartController);

chartsRouter.get('/:chartId', ValidateRequest(getChartByIdRequestSchema), controller.getChartById);
chartsRouter.post('/by-template/:templateId', ValidateRequest(getChartByTemplateIdRequestSchema), controller.getChartByTemplateId);
chartsRouter.post('/', ValidateRequest(createChartRequestSchema), controller.createChart);
chartsRouter.delete('/:chartId', ValidateRequest(deleteChartRequestSchema), controller.deleteChart);
chartsRouter.put('/:chartId', ValidateRequest(updateChartRequestSchema), controller.updateChart);

export default chartsRouter;
