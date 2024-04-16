import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import { wrapController, wrapMiddleware } from '../../utils/express';
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
    deleteRelationshipTemplateSchema,
    deleteRuleByIdRequestSchema,
    updateCategorySchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
    updateRelationshipTemplateSchema,
    updateRuleStatusByIdRequestSchema,
} from './validator.schema';
import { IMongoEntityTemplateWithConstraints } from './interfaces';

const {
    entityTemplateService: entityTemplateManager,
    relationshipTemplateService: relationshipTemplateManager,
    service: { uploadsFolderPath },
} = config;

const EntityTemplatesManagerProxy = createProxyMiddleware({
    target: entityTemplateManager.url,
    onProxyReq: (proxyReq, req, _res) => {
        fixRequestBody(proxyReq, req);
    },
    proxyTimeout: entityTemplateManager.requestTimeout,
});

const RelationshipTemplatesManagerProxy = createProxyMiddleware({
    target: relationshipTemplateManager.url,
    onProxyReq: (proxyReq, req, _res) => {
        fixRequestBody(proxyReq, req);
    },
    proxyTimeout: relationshipTemplateManager.requestTimeout,
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
templatesRouter.get('/categories', wrapMiddleware(validateUserHasAtLeastSomePermissions), EntityTemplatesManagerProxy);
templatesRouter.post(
    '/categories',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(createCategorySchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapController(TemplatesController.createCategory),
);
templatesRouter.put(
    '/categories/:id',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
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
templatesRouter.post(
    '/entities',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(createEntityTemplateSchema),
    wrapMiddleware(validateUserCanCreateEntityTemplateUnderCategory),
    wrapController(TemplatesController.createEntityTemplate, true, [], 'templates-entities'),
);
templatesRouter.put(
    '/entities/:id',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(updateEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    wrapController(TemplatesController.updateEntityTemplate, true, [], 'templates-entities'),
);
templatesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityTemplateStatusSchema),
    wrapController(TemplatesController.updateEntityTemplateStatus, true, [], 'templates-entities'),
);
templatesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    wrapController(TemplatesController.deleteEntityTemplate, true, [], 'templates-entities', fixDeleteResponseData),
);

// relationships (templates)
templatesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanCreateRelationshipTemplateUnderCategory),
    wrapController(TemplatesController.createRelationshipTemplate, true, [], 'templates-relationships'),
);
templatesRouter.put(
    '/relationships/:id',
    ValidateRequest(updateRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate),
    wrapController(TemplatesController.updateRelationshipTemplate, true, [], 'templates-relationships'),
);
templatesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate),
    wrapController(TemplatesController.deleteRelationshipTemplate, true, [], 'templates-relationships'),
);

// rules (templates)
templatesRouter.put('/rules/:ruleId', wrapMiddleware(validateUserIsRulesManager), RelationshipTemplatesManagerProxy);
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
templatesRouter.post('/rules', wrapMiddleware(validateUserIsRulesManager), RelationshipTemplatesManagerProxy);

export default templatesRouter;
