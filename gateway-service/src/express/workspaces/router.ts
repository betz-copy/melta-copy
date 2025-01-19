import { Router } from 'express';
import multer from 'multer';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../../config';
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
    updateMetadataSchema,
    updateOneSchema,
} from './validator.schema';

const controller = createWorkspacesController(WorkspaceController);

export const workspaceRouter: Router = Router();

const workspaceProxy = createProxyMiddleware({
    target: `${config.workspaceService.url}${config.workspaceService.baseRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
    proxyTimeout: config.workspaceService.requestTimeout,
});

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

workspaceRouter.patch('/:id/metadata', ValidateRequest(updateMetadataSchema), workspaceProxy);
