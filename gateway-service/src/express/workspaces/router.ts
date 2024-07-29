import { Router } from 'express';
import multer from 'multer';
import config from '../../config';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { WorkspaceController } from './controller';
import { createOneSchema, getByIdSchema, getDirSchema, getFileSchema, getWorkspaceIds, updateOneSchema } from './validator.schema';

// TODO stricter user validation
export const workspaceRouter: Router = Router();

workspaceRouter.get('/:type/ids', ValidateRequest(getWorkspaceIds), wrapController(WorkspaceController.getWorkspaceIds));

workspaceRouter.post('/dir', ValidateRequest(getDirSchema), wrapController(WorkspaceController.getDir));

workspaceRouter.post('/file', ValidateRequest(getFileSchema), wrapController(WorkspaceController.getFile));

workspaceRouter.get('/:id', ValidateRequest(getByIdSchema), wrapController(WorkspaceController.getById));

workspaceRouter.post(
    '/',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(createOneSchema),
    wrapController(WorkspaceController.createOne),
);

workspaceRouter.put(
    '/:id',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateOneSchema),
    wrapController(WorkspaceController.updateOne),
);
