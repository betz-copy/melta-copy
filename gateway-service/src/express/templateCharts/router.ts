import { Router } from 'express';
import { ChartController } from './controller';
import { createWorkspacesController } from '../../utils/express';

export const ChartsRouter: Router = Router();

const ChartsControllerMiddleware = createWorkspacesController(ChartController);

ChartsRouter.get('/:chartId', ChartsControllerMiddleware.getChartById);

ChartsRouter.get('/by-template/:templateId', ChartsControllerMiddleware.getChartsByTemplateId);

ChartsRouter.delete('', ChartsControllerMiddleware.deleteChart);

ChartsRouter.put('/:chartId', ChartsControllerMiddleware.updateChart);

ChartsRouter.post('/', ChartsControllerMiddleware.createChart);
