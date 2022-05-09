import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { wrapController, wrapMiddleware } from '../../utils/express';
import { validateUserHasAtLeastSomePermissions, validateUserIsTemplateManager } from '../permissions/validateAuthorizationMiddleware';
import TemplatesController from './controller';
import {
    validateUserCanCreateEntityTemplateUnderCategory,
    validateUserCanCreateRelationshipTemplateUnderCategory,
    validateUserCanUpdateOrDeleteEntityTemplate,
    validateUserCanUpdateOrDeleteRelationshipTemplate,
} from './middlewares';
import {
    getCategoriesSchema,
    createCategorySchema,
    deleteCategorySchema,
    updateCategorySchema,
    deleteEntityTemplateSchema,
    createEntityTemplateSchema,
    updateEntityTemplateSchema,
    createRelationshipTemplateRequestSchema,
    updateRelationshipTemplateByIdRequestSchema,
    deleteRelationshipTemplateByIdRequestSchema,
} from './validator.schema';
import config from '../../config';
import ValidateRequest from '../../utils/joi';

const { entityTemplateManager, relationshipTemplateManager } = config;

const EntityTemplatesManagerProxy = createProxyMiddleware({
    target: entityTemplateManager.uri,
    onProxyReq: fixRequestBody,
    proxyTimeout: entityTemplateManager.requestTimeout,
});

const RelationshipTemplatesManagerProxy = createProxyMiddleware({
    target: relationshipTemplateManager.uri,
    onProxyReq: fixRequestBody,
    proxyTimeout: relationshipTemplateManager.requestTimeout,
});

const templatesRouter: Router = Router();

// all needed categories
templatesRouter.get('/all', wrapMiddleware(validateUserHasAtLeastSomePermissions), wrapController(TemplatesController.getAllAllowedTemplates));

// categories
templatesRouter.get(
    '/categories',
    ValidateRequest(getCategoriesSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    EntityTemplatesManagerProxy,
);
templatesRouter.post(
    '/categories',
    ValidateRequest(createCategorySchema),
    wrapMiddleware(validateUserIsTemplateManager),
    EntityTemplatesManagerProxy,
);
templatesRouter.put(
    '/categories/:id',
    ValidateRequest(updateCategorySchema),
    wrapMiddleware(validateUserIsTemplateManager),
    EntityTemplatesManagerProxy,
);
templatesRouter.delete(
    '/categories/:id',
    ValidateRequest(deleteCategorySchema),
    wrapMiddleware(validateUserIsTemplateManager),
    EntityTemplatesManagerProxy,
);

// entities (templates)
templatesRouter.post(
    '/entities',
    ValidateRequest(createEntityTemplateSchema),
    wrapMiddleware(validateUserCanCreateEntityTemplateUnderCategory),
    EntityTemplatesManagerProxy,
);
templatesRouter.put(
    '/entities/:id',
    ValidateRequest(updateEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    EntityTemplatesManagerProxy,
);
templatesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    EntityTemplatesManagerProxy,
);

// relationships (templates)
templatesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipTemplateRequestSchema),
    wrapMiddleware(validateUserCanCreateRelationshipTemplateUnderCategory),
    RelationshipTemplatesManagerProxy,
);
templatesRouter.put(
    '/relationships/:id',
    ValidateRequest(updateRelationshipTemplateByIdRequestSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate),
    RelationshipTemplatesManagerProxy,
);
templatesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipTemplateByIdRequestSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate),
    RelationshipTemplatesManagerProxy,
);

export default templatesRouter;
