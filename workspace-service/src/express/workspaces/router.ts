import { Router } from 'express';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { WorkspacesController } from './controller';
import { createOneSchema, deleteOneSchema, getByIdSchema, getDirSchema, getFileSchema, updateOneSchema } from './validator.schema';

export const workspacesRouter: Router = Router();

workspacesRouter.post('/dir', ValidateRequest(getDirSchema), wrapController(WorkspacesController.getDir));

workspacesRouter.post('/file', ValidateRequest(getFileSchema), wrapController(WorkspacesController.getFile));

workspacesRouter.get('/:id', ValidateRequest(getByIdSchema), wrapController(WorkspacesController.getById));

workspacesRouter.post('/', ValidateRequest(createOneSchema), wrapController(WorkspacesController.createOne));

workspacesRouter.delete('/:id', ValidateRequest(deleteOneSchema), wrapController(WorkspacesController.deleteOne));

workspacesRouter.put('/:id', ValidateRequest(updateOneSchema), wrapController(WorkspacesController.updateOne));
