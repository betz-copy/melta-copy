import { Router } from 'express';
import GanttsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createGanttSchema, deleteGanttSchema, getGanttByIdSchema, searchGanttsSchema, updateGanttSchema } from './validator.schema';

const ganttsRouter: Router = Router();

ganttsRouter.get('/', wrapController(GanttsController.getAllGantts));
ganttsRouter.get('/:ganttId', ValidateRequest(getGanttByIdSchema), wrapController(GanttsController.getGanttById));
ganttsRouter.post('/', ValidateRequest(createGanttSchema), wrapController(GanttsController.createGantt));
ganttsRouter.post('/countOfUsedTemplate/:templateId', wrapController(GanttsController.isPropertyOfTemplateInUsed));
ganttsRouter.delete('/:ganttId', ValidateRequest(deleteGanttSchema), wrapController(GanttsController.deleteGantt));
ganttsRouter.put('/:ganttId', ValidateRequest(updateGanttSchema), wrapController(GanttsController.updateGantt));
ganttsRouter.post('/search', ValidateRequest(searchGanttsSchema), wrapController(GanttsController.searchGantts));

export default ganttsRouter;
