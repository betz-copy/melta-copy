import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import { createWorkspacesController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import TemplatesController from './controller';
import { TemplatesValidator } from './middlewares';
import {
    convertToRelationshipFieldRequestSchema,
    createCategorySchema,
    createEntityTemplateSchema,
    createRelationshipTemplateSchema,
    deleteCategorySchema,
    deleteEntityTemplateSchema,
    deleteFieldValueSchema,
    deleteRelationshipTemplateSchema,
    deleteRuleByIdRequestSchema,
    getCategoriesSchema,
    searchEntityTemplatesOfUserFromParamsSchema,
    searchEntityTemplatesSchema,
    searchRulesRequestSchema,
    searchTemplatesRequestSchema,
    updateCategorySchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
    updateFieldValueSchema,
    updateRelationshipTemplateSchema,
    updateRuleStatusByIdRequestSchema,
} from './validator.schema';
import { busboyMiddleware } from '../../utils/busboy/busboyMiddleware';

const {
    templateService: { url, requestTimeout, baseRoute },
} = config;

const TemplatesServiceProxy = createProxyMiddleware({
    target: `${url}${baseRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
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
    busboyMiddleware,
    ValidateRequest(createCategorySchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.createCategory,
);
templatesRouter.put(
    '/categories/:id',
    busboyMiddleware,
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

templatesRouter.post(
    '/categories/search',
    ValidateRequest(getCategoriesSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    templatesControllerMiddleware.searchCategories,
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
templatesRouter.patch('/entities/:id/actions', AuthorizerControllerMiddleware.userIsRootAdmin, TemplatesServiceProxy);
templatesRouter.post('/entities/search', AuthorizerControllerMiddleware.userCanReadTemplates, TemplatesServiceProxy);
templatesRouter.post(
    '/entities',
    busboyMiddleware,
    ValidateRequest(createEntityTemplateSchema),
    templatesValidatorMiddleware.validateUserCanCreateEntityTemplateUnderCategory,
    templatesControllerMiddleware.createEntityTemplate,
);
templatesRouter.put(
    '/entities/:id',
    busboyMiddleware,
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

templatesRouter.post(
    '/entities/search/template/:userId',
    ValidateRequest(searchEntityTemplatesOfUserFromParamsSchema),
    AuthorizerControllerMiddleware.userFromParamsHasSomePermissions,
    templatesControllerMiddleware.searchEntityTemplates,
);

templatesRouter.post(
    '/entities/search/template',
    ValidateRequest(searchEntityTemplatesSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    templatesControllerMiddleware.searchEntityTemplates,
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

templatesRouter.post(
    '/relationships/search',
    ValidateRequest(searchTemplatesRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    templatesControllerMiddleware.searchRelationshipTemplates,
);

templatesRouter.put(
    '/relationships/convertToRelationshipField/:id',
    ValidateRequest(convertToRelationshipFieldRequestSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.convertToRelationshipField,
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

templatesRouter.post(
    '/rules/search',
    ValidateRequest(searchRulesRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    templatesControllerMiddleware.searchRulesTemplates,
);

export default templatesRouter;
