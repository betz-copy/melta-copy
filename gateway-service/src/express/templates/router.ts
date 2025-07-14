import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { createController, ValidateRequest } from '@microservices/shared';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import TemplatesController from './controller';
import TemplatesValidator from './middlewares';
import {
    convertToRelationshipFieldRequestSchema,
    createCategorySchema,
    createEntityTemplateSchema,
    createPrintingTemplateSchema,
    createRelationshipTemplateSchema,
    deleteCategorySchema,
    deleteEntityTemplateSchema,
    deleteFieldValueSchema,
    deletePrintingTemplateSchema,
    deleteRelationshipTemplateSchema,
    deleteRuleByIdRequestSchema,
    getAllConfigsSchema,
    getCategoriesSchema,
    getConfigByTypeSchema,
    getPrintingTemplateByIdSchema,
    searchEntityTemplatesOfUserFromParamsSchema,
    searchEntityTemplatesSchema,
    searchPrintingTemplatesSchema,
    searchRulesRequestSchema,
    searchTemplatesRequestSchema,
    updateCategorySchema,
    updateCategoryTempOrderSchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
    updateFieldValueSchema,
    updatePrintingTemplateSchema,
    updateRelationshipTemplateSchema,
    updateRuleStatusByIdRequestSchema,
} from './validator.schema';
import busboyMiddleware from '../../utils/busboy/busboyMiddleware';

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

const templatesControllerMiddleware = createController(TemplatesController);
const templatesValidatorMiddleware = createController(TemplatesValidator, true);

// all needed categories
templatesRouter.get('/all', AuthorizerControllerMiddleware.userHasSomePermissions, templatesControllerMiddleware.getAllAllowedTemplates);

// categories
templatesRouter.get('/categories', AuthorizerControllerMiddleware.userHasSomePermissions, templatesControllerMiddleware.getAllAllowedCategories);
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
    AuthorizerControllerMiddleware.userCanWriteCategory,
    templatesControllerMiddleware.updateCategory,
);
templatesRouter.delete(
    '/categories/:id',
    ValidateRequest(deleteCategorySchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    AuthorizerControllerMiddleware.userCanWriteCategory,
    templatesControllerMiddleware.deleteCategory,
);

templatesRouter.post(
    '/categories/search',
    ValidateRequest(getCategoriesSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    templatesControllerMiddleware.searchCategories,
);

templatesRouter.patch(
    '/categories/templatesOrder/:templateId',
    ValidateRequest(updateCategoryTempOrderSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.updateCategoryTemplatesOrder,
);

// config

templatesRouter.get(
    `/config/all`,
    ValidateRequest(getAllConfigsSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    templatesControllerMiddleware.getAllConfigs,
);

templatesRouter.get(
    '/config/:type',
    ValidateRequest(getConfigByTypeSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    templatesControllerMiddleware.getConfigByType,
);

templatesRouter.put(
    '/config/categoryOrder/:configId',
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.updateCategoryOrderConfig,
);

templatesRouter.post('/config/categoryOrder', AuthorizerControllerMiddleware.userCanWriteTemplates, templatesControllerMiddleware.createOrderConfig);

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
templatesRouter.post('/entities/search', AuthorizerControllerMiddleware.userCanReadTemplates, templatesControllerMiddleware.searchEntityTemplates);
templatesRouter.post(
    '/entities',
    busboyMiddleware,
    ValidateRequest(createEntityTemplateSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesValidatorMiddleware.validateUserCanCreateEntityTemplateUnderCategory,
    templatesControllerMiddleware.createEntityTemplate,
);
templatesRouter.put(
    '/entities/:id',
    busboyMiddleware,
    ValidateRequest(updateEntityTemplateSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteEntityTemplate,
    templatesControllerMiddleware.updateEntityTemplate,
);
templatesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityTemplateStatusSchema),
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteEntityTemplate,
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
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteRelationshipTemplate,
    templatesControllerMiddleware.convertToRelationshipField,
);

// rules (templates)
templatesRouter.put(
    '/rules/:ruleId',
    AuthorizerControllerMiddleware.userCanWriteRules,
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteRuleTemplate,
    TemplatesServiceProxy,
);
templatesRouter.patch(
    '/rules/:ruleId/status',
    AuthorizerControllerMiddleware.userCanWriteRules,
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteRuleTemplate,
    ValidateRequest(updateRuleStatusByIdRequestSchema),
    templatesControllerMiddleware.updateRuleStatusById,
);
templatesRouter.delete(
    '/rules/:ruleId',
    AuthorizerControllerMiddleware.userCanWriteRules,
    templatesValidatorMiddleware.validateUserCanUpdateOrDeleteRuleTemplate,
    ValidateRequest(deleteRuleByIdRequestSchema),
    templatesControllerMiddleware.deleteRuleById,
);
templatesRouter.post(
    '/rules',
    AuthorizerControllerMiddleware.userCanWriteRules,
    templatesValidatorMiddleware.validateUserCanCreateRuleTemplate,
    TemplatesServiceProxy,
);
templatesRouter.post('/rules/get-many', AuthorizerControllerMiddleware.userCanWriteRules, templatesControllerMiddleware.getManyRulesByIds);

templatesRouter.post(
    '/rules/search',
    ValidateRequest(searchRulesRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    templatesControllerMiddleware.searchRulesTemplates,
);

// Printing Templates CRUD
templatesRouter.post(
    '/printing-templates',
    ValidateRequest(createPrintingTemplateSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.createPrintingTemplate,
);
templatesRouter.get(
    '/printing-templates/:id',
    ValidateRequest(getPrintingTemplateByIdSchema),
    AuthorizerControllerMiddleware.userCanReadTemplates,
    templatesControllerMiddleware.getPrintingTemplateById,
);
templatesRouter.put(
    '/printing-templates/:id',
    ValidateRequest(updatePrintingTemplateSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.updatePrintingTemplate,
);
templatesRouter.delete(
    '/printing-templates/:id',
    ValidateRequest(deletePrintingTemplateSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    templatesControllerMiddleware.deletePrintingTemplate,
);
templatesRouter.post(
    '/printing-templates/search',
    ValidateRequest(searchPrintingTemplatesSchema),
    AuthorizerControllerMiddleware.userCanReadTemplates,
    templatesControllerMiddleware.searchPrintingTemplates,
);

export default templatesRouter;
