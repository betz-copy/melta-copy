import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import config from '../../config';
import { wrapController, wrapMiddleware } from '../../utils/express';
import {
    validateUserCanCreateEntityInstance,
    validateUserCanCreateRelationshipInstance,
    validateUserCanExportEntities,
    validateUserCanGetExpandedEntity,
    validateUserCanIgnoreRules,
    validateUserCanSearchEntitiesBatch,
    validateUserCanSearchEntitiesOfTemplate,
    validateUserCanWriteEntityInstance,
    validateUserCanReadEntityInstance,
    validateUserCanUpdateOrDeleteRelationshipInstance,
} from './middlewares';
import { validateUserIsTemplatesManager } from '../permissions/validateAuthorizationMiddleware';
import InstancesController from './controller';
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
import ValidateRequest from '../../utils/joi';

const { instanceService } = config;
const InstanceManagerProxy = createProxyMiddleware({
    target: instanceService.url,
    onProxyReq: fixRequestBody,
    proxyTimeout: instanceService.requestTimeout,
});

const InstancesRouter: Router = Router();

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
    wrapController(InstancesController.exportEntities),
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
    wrapController(InstancesController.createEntityInstance, {
        toLog: true,
        logRequestFields: [],
        indexName: 'entities',
        responseDataExtractor: undefined,
    }),
);
InstancesRouter.put(
    '/entities/:id',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateEntityInstanceSchema),
    wrapMiddleware(validateUserCanWriteEntityInstance),
    wrapMiddleware(validateUserCanIgnoreRules),
    wrapController(InstancesController.updateEntityInstance, {
        toLog: true,
        logRequestFields: [],
        indexName: 'entities',
        responseDataExtractor: undefined,
    }),
);
InstancesRouter.post(
    '/entities/:id/duplicate',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateEntityInstanceSchema),
    wrapMiddleware(validateUserCanWriteEntityInstance),
    wrapController(InstancesController.duplicateEntityInstance),
);
InstancesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityInstanceSchema),
    wrapMiddleware(validateUserCanWriteEntityInstance),
    wrapController(InstancesController.deleteEntityInstance, {
        toLog: true,
        logRequestFields: [],
        indexName: 'entities',
        responseDataExtractor: (id: string) => ({ deletedId: id }),
    }),
);
InstancesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityStatusSchema),
    wrapMiddleware(validateUserCanWriteEntityInstance),
    wrapController(InstancesController.updateEntityStatus, {
        toLog: true,
        logRequestFields: [],
        indexName: 'entities',
        responseDataExtractor: undefined,
    }),
);

// relationships (Instances)
InstancesRouter.get('/relationships/count', wrapMiddleware(validateUserIsTemplatesManager), InstanceManagerProxy);
InstancesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipSchema),
    wrapMiddleware(validateUserCanCreateRelationshipInstance),
    wrapMiddleware(validateUserCanIgnoreRules),
    wrapController(InstancesController.createRelationshipInstance),
);
InstancesRouter.put('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance), InstanceManagerProxy);
InstancesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance),
    wrapMiddleware(validateUserCanIgnoreRules),
    wrapController(InstancesController.deleteRelationshipInstance),
);
InstancesRouter.post(
    '/bulk',
    // wrapMiddleware(validateUserCanWriteEntityInstance), // TODO
    wrapController(InstancesController.runBulkOfActions),
)

export default InstancesRouter;
