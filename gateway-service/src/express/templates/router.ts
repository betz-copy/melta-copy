import { Router } from 'express';
import { fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import { createWorkspacesController, createWorkspacesProxyMiddleware, wrapMiddleware } from '../../utils/express';
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
import { Authorizer } from '../../utils/authorizer';

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
const AuthorizerControllerMiddleware = createWorkspacesController(Authorizer);

// all needed categories
templatesRouter.get('/all', AuthorizerControllerMiddleware('userHasSomePermissions'), templatesControllerMiddleware('getAllAllowedTemplates'));

// categories
templatesRouter.get('/categories', AuthorizerControllerMiddleware('userHasSomePermissions'), EntityTemplatesManagerProxy);
templatesRouter.post(
    '/categories',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(createCategorySchema),
    AuthorizerControllerMiddleware('userCanWriteTemplates'),
    templatesControllerMiddleware('createCategory'),
);
templatesRouter.put(
    '/categories/:id',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(updateCategorySchema),
    AuthorizerControllerMiddleware('userCanWriteTemplates'),
    templatesControllerMiddleware('updateCategory'),
);
templatesRouter.delete(
    '/categories/:id',
    ValidateRequest(deleteCategorySchema),
    AuthorizerControllerMiddleware('userCanWriteTemplates'),
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
templatesRouter.put('/rules/:ruleId', AuthorizerControllerMiddleware('userCanWriteRules'), RelationshipTemplatesManagerProxy);
templatesRouter.patch(
    '/rules/:ruleId/status',
    AuthorizerControllerMiddleware('userCanWriteRules'),
    ValidateRequest(updateRuleStatusByIdRequestSchema),
    templatesControllerMiddleware('updateRuleStatusById'),
);
templatesRouter.delete(
    '/rules/:ruleId',
    AuthorizerControllerMiddleware('userCanWriteRules'),
    ValidateRequest(deleteRuleByIdRequestSchema),
    templatesControllerMiddleware('deleteRuleById'),
);
templatesRouter.post('/rules', AuthorizerControllerMiddleware('userCanWriteRules'), RelationshipTemplatesManagerProxy);

export default templatesRouter;
