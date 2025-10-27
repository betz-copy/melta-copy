import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { createController, ValidateRequest } from '@microservices/shared';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import InstancesController from './controller';
import InstancesValidator from './middlewares';
import {
    createEntityInstanceSchema,
    createRelationshipSchema,
    deleteEntityInstancesSchema,
    deleteRelationshipSchema,
    exportEntitiesSchema,
    exportEntityToDocumentSchema,
    exportEntityToDocumentSchemaByEntityId,
    searchEntitiesBatchRequestSchema,
    getEntitiesCountByTemplates,
    searchEntitiesByTemplatesSchema,
    searchEntitiesByLocationRequestSchema,
    updateEntityInstanceSchema,
    updateEntityStatusSchema,
    loadEntitiesSchema,
    editManyEntitiesByExcelSchema,
    updateMultipleEntitiesSchema,
    getChangedEntitiesFromExcelSchema,
} from './validator.schema';
import busboyMiddleware from '../../utils/busboy/busboyMiddleware';

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

const InstancesControllerMiddleware = createController(InstancesController);
const InstancesValidatorMiddleware = createController(InstancesValidator, true);

// entities (Instances)
InstancesRouter.post(
    '/entities/search/batch',
    ValidateRequest(searchEntitiesBatchRequestSchema),
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesBatch,
    InstancesControllerMiddleware.searchEntitiesBatch,
);

InstancesRouter.post(
    '/entities/search/location',
    ValidateRequest(searchEntitiesByLocationRequestSchema),
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesBatch,
    InstancesControllerMiddleware.searchEntitiesByLocation,
);

InstancesRouter.post(
    '/entities/search/template/:templateId',
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesOfTemplate,
    InstancesControllerMiddleware.searchEntitiesOfTemplate,
);

InstancesRouter.post('/entities/chart/:templateId', InstancesValidatorMiddleware.validateUserCanGetChart, InstanceManagerProxy);

InstancesRouter.post(
    '/entities/count',
    ValidateRequest(getEntitiesCountByTemplates),
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesByTemplates,
    InstancesControllerMiddleware.getEntitiesCountByTemplates,
);

InstancesRouter.post(
    '/entities/search/templates',
    ValidateRequest(searchEntitiesByTemplatesSchema),
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesByTemplates,
    InstanceManagerProxy,
);

InstancesRouter.post(
    '/entities/export',
    ValidateRequest(exportEntitiesSchema),
    InstancesValidatorMiddleware.validateUserCanExportEntities,
    InstancesControllerMiddleware.exportEntities,
);

InstancesRouter.post(
    '/entities/loadEntities',
    busboyMiddleware,
    ValidateRequest(loadEntitiesSchema),
    InstancesValidatorMiddleware.validateUserCanCreateEntityInstance,
    InstancesControllerMiddleware.loadEntities,
);

InstancesRouter.post(
    '/entities/getChangedEntitiesFromExcel',
    busboyMiddleware,
    ValidateRequest(getChangedEntitiesFromExcelSchema),
    InstancesValidatorMiddleware.validateUserCanCreateEntityInstance,
    InstancesControllerMiddleware.getChangedEntitiesFromExcel,
);

InstancesRouter.put(
    '/entities/editManyEntitiesByExcel',
    busboyMiddleware,
    ValidateRequest(editManyEntitiesByExcelSchema),
    InstancesValidatorMiddleware.validateUserCanCreateEntityInstance,
    InstancesControllerMiddleware.editManyEntitiesByExcel,
);

InstancesRouter.put(
    '/entities/bulk',
    busboyMiddleware,
    ValidateRequest(updateMultipleEntitiesSchema),
    InstancesValidatorMiddleware.validateUserCanWriteBulkEntityInstances,
    InstancesValidatorMiddleware.validateUserCanIgnoreRulesMultipleUpdate,
    InstancesControllerMiddleware.updateMultipleEntities,
);

InstancesRouter.get('/entities/:id', InstancesValidatorMiddleware.validateUserCanReadEntityInstance, InstanceManagerProxy);

InstancesRouter.get('/entities/constraints/:templateId', AuthorizerControllerMiddleware.userCanReadTemplates, InstanceManagerProxy);

InstancesRouter.post(
    '/entities/expanded/:id',
    InstancesValidatorMiddleware.validateUserCanReadEntityInstance,
    InstancesValidatorMiddleware.validateUserCanGetExpandedEntity,
    InstanceManagerProxy,
);

InstancesRouter.post(
    '/entities',
    busboyMiddleware,
    ValidateRequest(createEntityInstanceSchema),
    InstancesValidatorMiddleware.validateUserCanCreateEntityInstance,
    InstancesControllerMiddleware.createEntityInstance,
);

InstancesRouter.put(
    '/entities/:id',
    busboyMiddleware,
    ValidateRequest(updateEntityInstanceSchema),
    InstancesValidatorMiddleware.validateUserCanWriteEntityInstance,
    InstancesValidatorMiddleware.validateUserCanIgnoreRules,
    InstancesControllerMiddleware.updateEntityInstance,
);

InstancesRouter.post(
    '/entities/:id/duplicate',
    busboyMiddleware,
    ValidateRequest(updateEntityInstanceSchema),
    InstancesValidatorMiddleware.validateUserCanWriteEntityInstance,
    InstancesControllerMiddleware.duplicateEntityInstance,
);

InstancesRouter.post(
    '/entities/delete/bulk',
    ValidateRequest(deleteEntityInstancesSchema),
    InstancesValidatorMiddleware.validateUserCanWriteBulkEntityInstances,
    InstancesControllerMiddleware.deleteEntityInstances,
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
