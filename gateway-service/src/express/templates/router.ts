import { Router } from 'express';
import { fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import config from '../../config';
import { Authorizer } from '../../utils/authorizer';
import { createWorkspacesController, createWorkspacesProxyMiddleware, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import TemplatesController from './controller';
import {
    validateUserCanCreateEntityTemplateUnderCategory,
    validateUserCanCreateRelationshipTemplateUnderCategory,
    validateUserCanUpdateOrDeleteEntityTemplate,
    validateUserCanUpdateOrDeleteRelationshipTemplate,
} from './middlewares';
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

const {
    templateService: { url, requestTimeout },
    service: { uploadsFolderPath },
} = config;

const TemplatesServiceProxy = createWorkspacesProxyMiddleware({
    target: url,
    onProxyReq: fixRequestBody,
    proxyTimeout: requestTimeout,
});

const templatesRouter: Router = Router();

const templatesControllerMiddleware = createWorkspacesController(TemplatesController);
const AuthorizerControllerMiddleware = createWorkspacesController(Authorizer);

// all needed categories
templatesRouter.get('/all', AuthorizerControllerMiddleware('userHasSomePermissions'), templatesControllerMiddleware('getAllAllowedTemplates'));

// categories
templatesRouter.get('/categories', AuthorizerControllerMiddleware('userHasSomePermissions'), TemplatesServiceProxy);
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
templatesRouter.put(
    '/entities/update-enum-field/:id',
    ValidateRequest(updateFieldValueSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    templatesControllerMiddleware('updateEntityEnumFieldValue'),
);
templatesRouter.patch(
    '/entities/delete-enum-field/:id',
    ValidateRequest(deleteFieldValueSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteEntityTemplate),
    templatesControllerMiddleware('deleteEntityEnumFieldValue'),
);
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

templatesRouter.get(
    '/relationships/all',
    AuthorizerControllerMiddleware('userCanReadTemplates'),
    templatesControllerMiddleware('getAllRelationshipTemplates'),
);

// rules (templates)
templatesRouter.put('/rules/:ruleId', AuthorizerControllerMiddleware('userCanWriteRules'), TemplatesServiceProxy);
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
templatesRouter.post('/rules', AuthorizerControllerMiddleware('userCanWriteRules'), TemplatesServiceProxy);

export default templatesRouter;
