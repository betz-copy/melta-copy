import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import multer from 'multer';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import { createWorkspacesController, wrapMulter } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import TemplatesController from './controller';
import { TemplatesValidator } from './middlewares';
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

const TemplatesServiceProxy = createProxyMiddleware({
    target: url,
    onProxyReq: fixRequestBody,
    proxyTimeout: requestTimeout,
});

const templatesRouter: Router = Router();

const templatesControllerMiddleware = createWorkspacesController(TemplatesController);
const templatesValidatorMiddleware = createWorkspacesController(TemplatesValidator, true);

// all needed categories
templatesRouter.get('/all', AuthorizerControllerMiddleware.userHasSomePermissions, templatesControllerMiddleware.getAllAllowedTemplates);

// categories
templatesRouter.get('/categories', AuthorizerControllerMiddleware.userHasSomePermissions, TemplatesServiceProxy);
templatesRouter.post(
    '/categories',
    wrapMulter(multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file')),
    ValidateRequest(createCategorySchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.createCategory,
);
templatesRouter.put(
    '/categories/:id',
    wrapMulter(multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file')),
    ValidateRequest(updateCategorySchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.updateCategory,
);
templatesRouter.delete(
    '/categories/:id',
    ValidateRequest(deleteCategorySchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.deleteCategory,
);

// entities (templates)
templatesRouter.put(
    '/entities/update-enum-field/:id',
    ValidateRequest(updateFieldValueSchema),
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteEntityTemplate,
    templatesControllerMiddleware.updateEntityEnumFieldValue,
);
templatesRouter.patch(
    '/entities/delete-enum-field/:id',
    ValidateRequest(deleteFieldValueSchema),
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteEntityTemplate,
    templatesControllerMiddleware.deleteEntityEnumFieldValue,
);
templatesRouter.post('/entities/search', AuthorizerControllerMiddleware.userCanReadTemplates, TemplatesServiceProxy);
templatesRouter.post(
    '/entities',
    wrapMulter(
        multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).fields([
            { name: 'file', maxCount: 1 },
            { name: 'files' },
        ]),
    ),
    ValidateRequest(createEntityTemplateSchema),
    templatesValidatorMiddleware.validateUserCanCreateEntityTemplateUnderCategory,
    templatesControllerMiddleware.createEntityTemplate,
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
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteEntityTemplate,
    templatesControllerMiddleware.updateEntityTemplate,
);
templatesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityTemplateStatusSchema),
    templatesControllerMiddleware.updateEntityTemplateStatus,
);
templatesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityTemplateSchema),
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteEntityTemplate,
    templatesControllerMiddleware.deleteEntityTemplate,
);

// relationships (templates)
templatesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipTemplateSchema),
    templatesValidatorMiddleware.validateUserCanCreateRelationshipTemplateUnderCategory,
    templatesControllerMiddleware.createRelationshipTemplate,
);
templatesRouter.put(
    '/relationships/:id',
    ValidateRequest(updateRelationshipTemplateSchema),
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteRelationshipTemplate,
    templatesControllerMiddleware.updateRelationshipTemplate,
);
templatesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipTemplateSchema),
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteRelationshipTemplate,
    templatesControllerMiddleware.deleteRelationshipTemplate,
);

templatesRouter.get(
    '/relationships/all',
    AuthorizerControllerMiddleware.userCanReadTemplates,
    templatesControllerMiddleware.getAllRelationshipTemplates,
);

// rules (templates)
templatesRouter.put('/rules/:ruleId', AuthorizerControllerMiddleware.userCanWriteRules, TemplatesServiceProxy);
templatesRouter.patch(
    '/rules/:ruleId/status',
    AuthorizerControllerMiddleware.userCanWriteRules,
    ValidateRequest(updateRuleStatusByIdRequestSchema),
    templatesControllerMiddleware.updateRuleStatusById,
);
templatesRouter.delete(
    '/rules/:ruleId',
    AuthorizerControllerMiddleware.userCanWriteRules,
    ValidateRequest(deleteRuleByIdRequestSchema),
    templatesControllerMiddleware.deleteRuleById,
);
templatesRouter.post(['/rules', '/rules/get-many'], AuthorizerControllerMiddleware.userCanWriteRules, TemplatesServiceProxy);

export default templatesRouter;
