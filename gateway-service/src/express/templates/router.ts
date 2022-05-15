import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import * as multer from 'multer';
import { wrapController, wrapMiddleware } from '../../utils/express';
import { validateUserHasAtLeastSomePermissions, validateUserIsTemplateManager } from '../permissions/validateAuthorizationMiddleware';
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
    deleteCategorySchema,
    deleteEntityTemplateSchema,
    updateCategorySchema,
    updateEntityTemplateSchema,
} from './validator.schema';

const {
    entityTemplateManager,
    relationshipTemplateManager,
    service: { uploadsFolderPath },
} = config;

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
templatesRouter.get('/categories', wrapMiddleware(validateUserHasAtLeastSomePermissions), EntityTemplatesManagerProxy);
templatesRouter.post(
    '/categories',
    multer({ dest: uploadsFolderPath }).single('file'),
    ValidateRequest(createCategorySchema),
    wrapMiddleware(validateUserIsTemplateManager),
    wrapController(TemplatesController.createCategory),
);
templatesRouter.put(
    '/categories/:id',
    multer({ dest: uploadsFolderPath }).single('file'),
    ValidateRequest(updateCategorySchema),
    wrapMiddleware(validateUserIsTemplateManager),
    wrapController(TemplatesController.updateCategory),
);
templatesRouter.delete(
    '/categories/:id',
    ValidateRequest(deleteCategorySchema),
    wrapMiddleware(validateUserIsTemplateManager),
    wrapController(TemplatesController.deleteCategory),
);

// entities (templates)
templatesRouter.post(
    '/entities',
    multer({ dest: uploadsFolderPath }).single('file'),
    ValidateRequest(createEntityTemplateSchema),
    wrapMiddleware(validateUserCanCreateEntityTemplateUnderCategory),
    wrapController(TemplatesController.createTemplate),
);
templatesRouter.put(
    '/entities/:id',
    multer({ dest: uploadsFolderPath }).single('file'),
    ValidateRequest(updateEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    wrapController(TemplatesController.updateEntityTemplate),
);
templatesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityTemplateSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    wrapController(TemplatesController.deleteTemplate),
);

// relationships (templates)
templatesRouter.post('/relationships', wrapMiddleware(validateUserCanCreateRelationshipTemplateUnderCategory), RelationshipTemplatesManagerProxy);
templatesRouter.put('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate), RelationshipTemplatesManagerProxy);
templatesRouter.delete('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate), RelationshipTemplatesManagerProxy);

export default templatesRouter;
