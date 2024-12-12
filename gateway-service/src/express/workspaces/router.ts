import { Router } from 'express';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import { createWorkspacesController, wrapController } from '../../utils/express';
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
import { busboyMiddleware } from '../../utils/busboy/busboyMiddleware';

const controller = createWorkspacesController(WorkspaceController);

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
    busboyMiddleware,
    ValidateRequest(createOneSchema),
    AuthorizerControllerMiddleware.userCanWriteWorkspaces,
    controller.createOne,
);

workspaceRouter.put(
    '/:id',
    busboyMiddleware,
    ValidateRequest(updateOneSchema),
    AuthorizerControllerMiddleware.userCanWriteWorkspaces,
    controller.updateOne,
);
