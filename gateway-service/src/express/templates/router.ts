import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import { wrapController, wrapMiddleware, wrapMulter } from '../../utils/express';
import {
    validateUserHasAtLeastSomePermissions,
    validateUserIsRulesManager,
    validateUserIsTemplatesManager,
} from '../permissions/validateAuthorizationMiddleware';
import TemplatesController from './controller';
import {
    validateUserCanCreateEntityTemplateUnderCategory,
    validateUserCanCreateRelationshipTemplateUnderCategory,
    validateUserCanUpdateOrDeleteEntityTemplate,
    validateUserCanUpdateOrDeleteRelationshipTemplate,
} from './middlewares';
import config from '../../config';
import ValidateRequest from '../../utils/joi';
import {
    createCategorySchema,
    createEntityTemplateSchema,
    createRelationshipTemplateSchema,
    deleteCategorySchema,
    deleteEntityTemplateSchema,
    deleteFieldValueSchema,
    deleteRelationshipTemplateSchema,
    deleteRuleByIdRequestSchema,
    updateCategorySchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
    updateFieldValueSchema,
    updateRelationshipTemplateSchema,
    updateRuleStatusByIdRequestSchema,
} from './validator.schema';
import { IMongoEntityTemplateWithConstraints } from './interfaces';

const {
    templateService: { url, requestTimeout },
    service: { uploadsFolderPath },
} = config;

const TemplatesServiceProxy = createProxyMiddleware({
    target: url,
    onProxyReq: (proxyReq, req, _res) => {
        fixRequestBody(proxyReq, req);
    },
    proxyTimeout: requestTimeout,
});

const fixDeleteResponseData = (data: IMongoEntityTemplateWithConstraints) => {
    const logData = JSON.parse(JSON.stringify(data));
    logData.category = { _id: data.category };
    return logData;
};

const templatesRouter: Router = Router();

// all needed categories
templatesRouter.get('/all', wrapMiddleware(validateUserHasAtLeastSomePermissions), wrapController(TemplatesController.getAllAllowedTemplates));

// categories
templatesRouter.get('/categories', wrapMiddleware(validateUserHasAtLeastSomePermissions), TemplatesServiceProxy);
templatesRouter.post(
    '/categories',
    wrapMulter(multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file')),
    ValidateRequest(createCategorySchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapController(TemplatesController.createCategory),
);
templatesRouter.put(
    '/categories/:id',
    wrapMulter(multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file')),
    ValidateRequest(updateCategorySchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapController(TemplatesController.updateCategory),
);
templatesRouter.delete(
    '/categories/:id',
    ValidateRequest(deleteCategorySchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapController(TemplatesController.deleteCategory),
);

// entities (templates)
templatesRouter.put(
    '/entities/update-enum-field/:id',
    ValidateRequest(updateFieldValueSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    wrapController(TemplatesController.updateEntityEnumFieldValue),
);
templatesRouter.patch(
    '/entities/delete-enum-field/:id',
    ValidateRequest(deleteFieldValueSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    wrapController(TemplatesController.deleteEntityEnumFieldValue),
);
templatesRouter.post(
    '/entities',
    wrapMulter(
        multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).fields([
            { name: 'file', maxCount: 1 },
            { name: 'files' },
        ]),
    ),
    ValidateRequest(createEntityTemplateSchema),
    wrapMiddleware(validateUserCanCreateEntityTemplateUnderCategory),
    wrapController(TemplatesController.createEntityTemplate, {
        toLog: true,
        logRequestFields: [],
        indexName: 'templates-entities',
        responseDataExtractor: undefined,
    }),
);
templatesRouter.put(
    '/entities/:id',
    wrapMulter(
        multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).fields([
            { name: 'file', maxCount: 1 },
            { name: 'files' },
        ]),
    ),
    ValidateRequest(updateEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    wrapController(TemplatesController.updateEntityTemplate, {
        toLog: true,
        logRequestFields: [],
        indexName: 'templates-entities',
        responseDataExtractor: undefined,
    }),
);
templatesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityTemplateStatusSchema),
    wrapController(TemplatesController.updateEntityTemplateStatus, {
        toLog: true,
        logRequestFields: [],
        indexName: 'templates-entities',
        responseDataExtractor: undefined,
    }),
);
templatesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    wrapController(TemplatesController.deleteEntityTemplate, {
        toLog: true,
        logRequestFields: [],
        indexName: 'templates-entities',
        responseDataExtractor: fixDeleteResponseData,
    }),
);

// relationships (templates)
templatesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanCreateRelationshipTemplateUnderCategory),
    wrapController(TemplatesController.createRelationshipTemplate, {
        toLog: true,
        logRequestFields: [],
        indexName: 'templates-relationships',
        responseDataExtractor: undefined,
    }),
);
templatesRouter.put(
    '/relationships/:id',
    ValidateRequest(updateRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate),
    wrapController(TemplatesController.updateRelationshipTemplate, {
        toLog: true,
        logRequestFields: [],
        indexName: 'templates-relationships',
        responseDataExtractor: undefined,
    }),
);
templatesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate),
    wrapController(TemplatesController.deleteRelationshipTemplate, {
        toLog: true,
        logRequestFields: [],
        indexName: 'templates-relationships',
        responseDataExtractor: undefined,
    }),
);

templatesRouter.get(
    '/relationships/all',
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapController(TemplatesController.getAllRelationshipTemplates),
);

// rules (templates)
templatesRouter.put('/rules/:ruleId', wrapMiddleware(validateUserIsRulesManager), TemplatesServiceProxy);
templatesRouter.patch(
    '/rules/:ruleId/status',
    wrapMiddleware(validateUserIsRulesManager),
    ValidateRequest(updateRuleStatusByIdRequestSchema),
    wrapController(TemplatesController.updateRuleStatusById),
);
templatesRouter.delete(
    '/rules/:ruleId',
    wrapMiddleware(validateUserIsRulesManager),
    ValidateRequest(deleteRuleByIdRequestSchema),
    wrapController(TemplatesController.deleteRuleById),
);
templatesRouter.post('/rules/get-many', wrapMiddleware(validateUserIsRulesManager), TemplatesServiceProxy);
templatesRouter.post('/rules', wrapMiddleware(validateUserIsRulesManager), TemplatesServiceProxy);

export default templatesRouter;
