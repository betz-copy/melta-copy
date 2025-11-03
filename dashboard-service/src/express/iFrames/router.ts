import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import IFrameController from './controller';
import { createIFrameSchema, deleteIFrameSchema, getIFrameByIdSchema, searchIFramesSchema, updateIFrameSchema } from './validator.schema';

const iFramesRouter: Router = Router();

const controller = createController(IFrameController);

iFramesRouter.post('/search', ValidateRequest(searchIFramesSchema), controller.searchIFrames);
iFramesRouter.get('/:iFrameId', ValidateRequest(getIFrameByIdSchema), controller.getIFrameById);
iFramesRouter.post('/', ValidateRequest(createIFrameSchema), controller.createIFrame);
iFramesRouter.put('/:iFrameId', ValidateRequest(updateIFrameSchema), controller.updateIFrame);
iFramesRouter.delete('/:iFrameId', ValidateRequest(deleteIFrameSchema), controller.deleteIFrame);

export default iFramesRouter;
