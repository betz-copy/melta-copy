import { Router } from 'express';
import multer from 'multer';
import { createController } from '@microservices/shared';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { WorkspaceController } from './controller';
import {
    createOneSchema,
    getByIdSchema,
    getDirSchema,
    getFileSchema,
    getWorkspaceHierarchyIdsSchema,
    getWorkspaceIds,
    updateOneSchema,
} from './validator.schema';

const controller = createController(WorkspaceController);

export const workspaceRouter: Router = Router();

workspaceRouter.post(
    '/ids',
    ValidateRequest(getWorkspaceIds),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    wrapController(WorkspaceController.getWorkspaceIds),
);

workspaceRouter.post('/dir', ValidateRequest(getDirSchema), wrapController(WorkspaceController.getDir));

workspaceRouter.post('/file', ValidateRequest(getFileSchema), wrapController(WorkspaceController.getFile));

workspaceRouter.get(
    '/:id/ids/hierarchy',
    ValidateRequest(getWorkspaceHierarchyIdsSchema),
    wrapController(WorkspaceController.getWorkspaceHierarchyIds),
);

workspaceRouter.get('/:id', ValidateRequest(getByIdSchema), wrapController(WorkspaceController.getById));

workspaceRouter.post(
    '/',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(createOneSchema),
    AuthorizerControllerMiddleware.userCanWriteWorkspaces,
    controller.createOne,
);

workspaceRouter.put(
    '/:id',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateOneSchema),
    AuthorizerControllerMiddleware.userCanWriteWorkspaces,
    controller.updateOne,
);
