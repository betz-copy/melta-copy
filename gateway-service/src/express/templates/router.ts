import { Router } from 'express';
import { fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import { createWorkspacesController, createWorkspacesProxyMiddleware, wrapMiddleware } from '../../utils/express';
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

const {
    entityTemplateService: entityTemplateManager,
    relationshipTemplateService: relationshipTemplateManager,
    service: { uploadsFolderPath },
} = config;

const EntityTemplatesManagerProxy = createWorkspacesProxyMiddleware({
    target: entityTemplateManager.url,
    onProxyReq: fixRequestBody,
    proxyTimeout: entityTemplateManager.requestTimeout,
});

const RelationshipTemplatesManagerProxy = createWorkspacesProxyMiddleware({
    target: relationshipTemplateManager.url,
    onProxyReq: fixRequestBody,
    proxyTimeout: relationshipTemplateManager.requestTimeout,
});

const templatesRouter: Router = Router();

const templatesControllerMiddleware = createWorkspacesController(TemplatesController);

// all needed categories
templatesRouter.get('/all', wrapMiddleware(validateUserHasAtLeastSomePermissions), templatesControllerMiddleware('getAllAllowedTemplates'));

// categories
templatesRouter.get('/categories', wrapMiddleware(validateUserHasAtLeastSomePermissions), EntityTemplatesManagerProxy);
templatesRouter.post(
    '/categories',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(createCategorySchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    templatesControllerMiddleware('createCategory'),
);
templatesRouter.put(
    '/categories/:id',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(updateCategorySchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    templatesControllerMiddleware('updateCategory'),
);
templatesRouter.delete(
    '/categories/:id',
    ValidateRequest(deleteCategorySchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    templatesControllerMiddleware('deleteCategory'),
);

// entities (templates)
templatesRouter.post(
    '/entities',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(createEntityTemplateSchema),
    wrapMiddleware(validateUserCanCreateEntityTemplateUnderCategory),
    templatesControllerMiddleware('createEntityTemplate'),
);
templatesRouter.put(
    '/entities/:id',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(updateEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    templatesControllerMiddleware('updateEntityTemplate'),
);
templatesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityTemplateStatusSchema),
    templatesControllerMiddleware('updateEntityTemplateStatus'),
);
templatesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    templatesControllerMiddleware('deleteEntityTemplate'),
);

// relationships (templates)
templatesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanCreateRelationshipTemplateUnderCategory),
    templatesControllerMiddleware('createRelationshipTemplate'),
);
templatesRouter.put(
    '/relationships/:id',
    ValidateRequest(updateRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate),
    templatesControllerMiddleware('updateRelationshipTemplate'),
);
templatesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate),
    templatesControllerMiddleware('deleteRelationshipTemplate'),
);

// rules (templates)
templatesRouter.put('/rules/:ruleId', wrapMiddleware(validateUserIsRulesManager), RelationshipTemplatesManagerProxy);
templatesRouter.patch(
    '/rules/:ruleId/status',
    wrapMiddleware(validateUserIsRulesManager),
    ValidateRequest(updateRuleStatusByIdRequestSchema),
    templatesControllerMiddleware('updateRuleStatusById'),
);
templatesRouter.delete(
    '/rules/:ruleId',
    wrapMiddleware(validateUserIsRulesManager),
    ValidateRequest(deleteRuleByIdRequestSchema),
    templatesControllerMiddleware('deleteRuleById'),
);
templatesRouter.post('/rules', wrapMiddleware(validateUserIsRulesManager), RelationshipTemplatesManagerProxy);

export default templatesRouter;
