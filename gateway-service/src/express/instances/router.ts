import { Router } from 'express';
import { fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import { createWorkspacesController, createWorkspacesProxyMiddleware, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { InstancesController } from './controller';
import {
    validateUserCanCreateEntityInstance,
    validateUserCanCreateRelationshipInstance,
    validateUserCanExportEntities,
    validateUserCanGetExpandedEntity,
    validateUserCanIgnoreRules,
    validateUserCanReadEntityInstance,
    validateUserCanSearchEntitiesBatch,
    validateUserCanSearchEntitiesOfTemplate,
    validateUserCanUpdateOrDeleteRelationshipInstance,
    validateUserCanWriteEntityInstance,
} from './middlewares';
import {
    createEntityInstanceSchema,
    createRelationshipSchema,
    deleteEntityInstanceSchema,
    deleteRelationshipSchema,
    exportEntitiesSchema,
    searchEntitiesBatchRequestSchema,
    updateEntityInstanceSchema,
    updateEntityStatusSchema,
} from './validator.schema';

const { instanceService } = config;

const InstanceManagerProxy = createWorkspacesProxyMiddleware({
    target: instanceService.url,
    onProxyReq: fixRequestBody,
    proxyTimeout: instanceService.requestTimeout,
});

const InstancesRouter: Router = Router();

const InstancesControllerMiddleware = createWorkspacesController(InstancesController);

// entities (Instances)
InstancesRouter.post(
    '/entities/search/batch',
    ValidateRequest(searchEntitiesBatchRequestSchema),
    wrapMiddleware(validateUserCanSearchEntitiesBatch),
    InstanceManagerProxy,
);
InstancesRouter.post('/entities/search/template/:templateId', wrapMiddleware(validateUserCanSearchEntitiesOfTemplate), InstanceManagerProxy);
InstancesRouter.post(
    '/entities/export',
    wrapMiddleware(validateUserCanExportEntities),
    ValidateRequest(exportEntitiesSchema),
    InstancesControllerMiddleware('exportEntities'),
);
InstancesRouter.get('/entities/:id', wrapMiddleware(validateUserCanReadEntityInstance), InstanceManagerProxy);

InstancesRouter.post(
    '/entities/expanded/:id',
    wrapMiddleware(validateUserCanReadEntityInstance),
    wrapMiddleware(validateUserCanGetExpandedEntity),
    InstanceManagerProxy,
);

InstancesRouter.post(
    '/entities',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(createEntityInstanceSchema),
    wrapMiddleware(validateUserCanCreateEntityInstance),
    InstancesControllerMiddleware('createEntityInstance'),
);
InstancesRouter.put(
    '/entities/:id',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateEntityInstanceSchema),
    wrapMiddleware(validateUserCanWriteEntityInstance),
    wrapMiddleware(validateUserCanIgnoreRules),
    InstancesControllerMiddleware('updateEntityInstance'),
);
InstancesRouter.post(
    '/entities/:id/duplicate',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateEntityInstanceSchema),
    wrapMiddleware(validateUserCanWriteEntityInstance),
    InstancesControllerMiddleware('duplicateEntityInstance'),
);
InstancesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityInstanceSchema),
    wrapMiddleware(validateUserCanWriteEntityInstance),
    InstancesControllerMiddleware('deleteEntityInstance'),
);
InstancesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityStatusSchema),
    wrapMiddleware(validateUserCanWriteEntityInstance),
    InstancesControllerMiddleware('updateEntityStatus'),
);

// relationships (Instances)
InstancesRouter.get('/relationships/count', AuthorizerControllerMiddleware('userCanReadTemplates'), InstanceManagerProxy);
InstancesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipSchema),
    wrapMiddleware(validateUserCanCreateRelationshipInstance),
    wrapMiddleware(validateUserCanIgnoreRules),
    InstancesControllerMiddleware('createRelationshipInstance'),
);
InstancesRouter.put('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance), InstanceManagerProxy);
InstancesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance),
    wrapMiddleware(validateUserCanIgnoreRules),
    InstancesControllerMiddleware('deleteRelationshipInstance'),
);

export default InstancesRouter;
