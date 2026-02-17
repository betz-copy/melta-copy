import { createController, ValidateRequest, wrapController } from '@packages/utils';
import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import busboyMiddleware from '../../utils/busboy/busboyMiddleware';
import WorkspaceController from './controller';
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

const controller = createController(WorkspaceController);

const workspaceRouter: Router = Router();

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
workspaceRouter.patch('/:id/metadata', ValidateRequest(updateMetadataSchema), workspaceProxy);

export default workspaceRouter;
