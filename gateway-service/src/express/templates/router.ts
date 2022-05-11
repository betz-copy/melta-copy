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

import config from '../../config';

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
templatesRouter.get('/categories', wrapMiddleware(validateUserHasAtLeastSomePermissions), EntityTemplatesManagerProxy);
templatesRouter.post('/categories', wrapMiddleware(validateUserIsTemplateManager), EntityTemplatesManagerProxy);
templatesRouter.put('/categories/:id', wrapMiddleware(validateUserIsTemplateManager), EntityTemplatesManagerProxy);
templatesRouter.delete('/categories/:id', wrapMiddleware(validateUserIsTemplateManager), EntityTemplatesManagerProxy);

// entities (templates)
templatesRouter.post('/entities', wrapMiddleware(validateUserCanCreateEntityTemplateUnderCategory), EntityTemplatesManagerProxy);
templatesRouter.put('/entities/:id', wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate), EntityTemplatesManagerProxy);
templatesRouter.delete('/entities/:id', wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate), EntityTemplatesManagerProxy);

// relationships (templates)
templatesRouter.post('/relationships', wrapMiddleware(validateUserCanCreateRelationshipTemplateUnderCategory), RelationshipTemplatesManagerProxy);
templatesRouter.put('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate), RelationshipTemplatesManagerProxy);
templatesRouter.delete('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipTemplate), RelationshipTemplatesManagerProxy);

export default templatesRouter;
