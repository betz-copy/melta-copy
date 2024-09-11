import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import config from '../../config';
import { wrapMulter, createWorkspacesController } from '../../utils/express';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import ValidateRequest from '../../utils/joi';
import { InstancesController } from './controller';
import { InstancesValidator } from './middlewares';
import {
    createEntityInstanceSchema,
    createRelationshipSchema,
    deleteEntityInstanceSchema,
    deleteRelationshipSchema,
    exportEntitiesSchema,
    exportEntityToDocumentSchema,
    exportEntityToDocumentSchemaByEntityId,
    searchEntitiesBatchRequestSchema,
    updateEntityInstanceSchema,
    updateEntityStatusSchema,
} from './validator.schema';

const { instanceService } = config;

const InstanceManagerProxy = createProxyMiddleware({
    target: `${instanceService.url}${instanceService.baseRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
    proxyTimeout: instanceService.requestTimeout,
});

const InstancesRouter: Router = Router();

const InstancesControllerMiddleware = createWorkspacesController(InstancesController);
const InstancesValidatorMiddleware = createWorkspacesController(InstancesValidator, true);

// entities (Instances)
InstancesRouter.post(
    '/entities/search/batch',
    ValidateRequest(searchEntitiesBatchRequestSchema),
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesBatch,
    InstanceManagerProxy,
);
InstancesRouter.post(
    '/entities/search/template/:templateId',
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesOfTemplate,
    InstanceManagerProxy,
);
InstancesRouter.post(
    '/entities/export',
    InstancesValidatorMiddleware.validateUserCanExportEntities,
    ValidateRequest(exportEntitiesSchema),
    InstancesControllerMiddleware.exportEntities,
);
InstancesRouter.get('/entities/:id', InstancesValidatorMiddleware.validateUserCanReadEntityInstance, InstanceManagerProxy);

InstancesRouter.post(
    '/entities/expanded/:id',
    InstancesValidatorMiddleware.validateUserCanReadEntityInstance,
    InstancesValidatorMiddleware.validateUserCanGetExpandedEntity,
    InstanceManagerProxy,
);

InstancesRouter.post(
    '/entities',
    wrapMulter(multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any()),
    ValidateRequest(createEntityInstanceSchema),
    InstancesValidatorMiddleware.validateUserCanCreateEntityInstance,
    InstancesControllerMiddleware.createEntityInstance,
);
InstancesRouter.put(
    '/entities/:id',
    wrapMulter(multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any()),
    ValidateRequest(updateEntityInstanceSchema),
    InstancesValidatorMiddleware.validateUserCanWriteEntityInstance,
    InstancesValidatorMiddleware.validateUserCanIgnoreRules,
    InstancesControllerMiddleware.updateEntityInstance,
);
InstancesRouter.post(
    '/entities/:id/duplicate',
    wrapMulter(multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any()),
    ValidateRequest(updateEntityInstanceSchema),
    InstancesValidatorMiddleware.validateUserCanWriteEntityInstance,
    InstancesControllerMiddleware.duplicateEntityInstance,
);
InstancesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityInstanceSchema),
    InstancesValidatorMiddleware.validateUserCanWriteEntityInstance,
    InstancesControllerMiddleware.deleteEntityInstance,
);
InstancesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityStatusSchema),
    InstancesValidatorMiddleware.validateUserCanWriteEntityInstance,
    InstancesControllerMiddleware.updateEntityStatus,
);

InstancesRouter.post(
    '/entities/export/document',
    ValidateRequest(exportEntityToDocumentSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    InstancesControllerMiddleware.exportEntityToDocumentTemplate,
);

InstancesRouter.post(
    '/entities/export/document/:entityId',
    ValidateRequest(exportEntityToDocumentSchemaByEntityId),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    InstancesControllerMiddleware.exportEntityToDocumentSchemaByEntityId,
);

// relationships (Instances)
InstancesRouter.get('/relationships/count', AuthorizerControllerMiddleware.userCanReadTemplates, InstanceManagerProxy);
InstancesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipSchema),
    InstancesValidatorMiddleware.validateUserCanCreateRelationshipInstance,
    InstancesValidatorMiddleware.validateUserCanIgnoreRules,
    InstancesControllerMiddleware.createRelationshipInstance,
);
InstancesRouter.put('/relationships/:id', InstancesValidatorMiddleware.validateUserCanUpdateOrDeleteRelationshipInstance, InstanceManagerProxy);
InstancesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipSchema),
    InstancesValidatorMiddleware.validateUserCanUpdateOrDeleteRelationshipInstance,
    InstancesValidatorMiddleware.validateUserCanIgnoreRules,
    InstancesControllerMiddleware.deleteRelationshipInstance,
);
InstancesRouter.post('/bulk', InstancesValidatorMiddleware.validateUserCanWriteBulkEntityInstance, InstancesControllerMiddleware.runBulkOfActions);

export default InstancesRouter;
