import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import GanttsController from './controller';
import { createGanttSchema, deleteGanttSchema, getGanttByIdSchema, searchGanttsSchema, updateGanttSchema } from './validator.schema';

const ganttsRouter: Router = Router();

const controller = createController(GanttsController);

ganttsRouter.get('/:ganttId', ValidateRequest(getGanttByIdSchema), controller.getGanttById);
ganttsRouter.post('/', ValidateRequest(createGanttSchema), controller.createGantt);
ganttsRouter.delete('/:ganttId', ValidateRequest(deleteGanttSchema), controller.deleteGantt);
ganttsRouter.put('/:ganttId', ValidateRequest(updateGanttSchema), controller.updateGantt);
ganttsRouter.post('/search', ValidateRequest(searchGanttsSchema), controller.searchGantts);

export default ganttsRouter;
