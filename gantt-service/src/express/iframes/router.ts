import { Router } from 'express';
import IFramesController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createIFrameSchema, deleteIFrameSchema, getIFrameByIdSchema, searchIFramesSchema, updateIFrameSchema } from './validator.schema';

const iFramesRouter: Router = Router();

iFramesRouter.get('/:iFrameId', ValidateRequest(getIFrameByIdSchema), wrapController(IFramesController.getIFrameById));
iFramesRouter.get('/', wrapController(IFramesController.getAllIFrames));
iFramesRouter.post('/', ValidateRequest(createIFrameSchema), wrapController(IFramesController.createIFrame));
iFramesRouter.delete('/:iFrameId', ValidateRequest(deleteIFrameSchema), wrapController(IFramesController.deleteIFrame));
iFramesRouter.put('/:iFrameId', ValidateRequest(updateIFrameSchema), wrapController(IFramesController.updateIFrame));
iFramesRouter.post('/search', ValidateRequest(searchIFramesSchema), wrapController(IFramesController.searchIFrames));

export default iFramesRouter;
