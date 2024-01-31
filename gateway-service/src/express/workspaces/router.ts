import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { WorkspaceController } from './controller';
import { createOneSchema, getByIdSchema, getDirSchema, getFileSchema, updateOneSchema } from './validator.schema';

// TODO stricter user validation
export const workspaceRouter: Router = Router();

workspaceRouter.post('/dir', ValidateRequest(getDirSchema), wrapController(WorkspaceController.getDir));

workspaceRouter.post('/file', ValidateRequest(getFileSchema), wrapController(WorkspaceController.getFile));

workspaceRouter.get('/:id', ValidateRequest(getByIdSchema), wrapController(WorkspaceController.getById));

workspaceRouter.post('/', ValidateRequest(createOneSchema), wrapController(WorkspaceController.createOne));

workspaceRouter.put('/:id', ValidateRequest(updateOneSchema), wrapController(WorkspaceController.updateOne));
