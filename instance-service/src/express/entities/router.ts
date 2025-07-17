import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import EntityController from './controller';
import {
    countEntitiesOfTemplatesRequestSchema,
    createEntityRequestSchema,
    deleteEntitiesByTemplateIdRequestSchema,
    deleteEntitiesByIdsRequestSchema,
    enumerateNewSerialNumberFieldsRequestSchema,
    getAllConstraintsRequestSchema,
    getConstraintsOfTemplateRequestSchema,
    getEntitiesByIdsRequestSchema,
    getEntityByIdRequestSchema,
    getExpandedGraphByIdRequestSchema,
    getIfValueFieldIsUsedRequestSchema,
    searchEntitiesBatchRequestSchema,
    searchEntitiesByTemplatesSchema,
    searchEntitiesOfTemplateRequestSchema,
    updateConstraintsOfTemplateRequestSchema,
    updateEntityStatusByIdRequestSchema,
    updateEnumFieldRequestSchema,
    deletePropertiesOfTemplateRequestSchema,
    chartSchema,
    convertFieldsToPluralRequestSchema,
    searchEntitiesByLocation,
    updateEntityByIdRequestSchema,
    getDependentRulesRequestSchema,
    convertToRelationshipFieldRequestSchema,
    countEntitiesOfTemplatesByUserEntityIdRequestSchema,
    getSelectedEntitiesRequestSchema,
} from './validator.schema';
import { EntityValidator } from './validator.template';

const entityRouter: Router = Router();

const entityController = createController(EntityController);
const entityValidatorController = createController(EntityValidator, true);

entityRouter.get('/constraints/:templateId', ValidateRequest(getConstraintsOfTemplateRequestSchema), entityController.getConstraintsOfTemplate);
entityRouter.get('/constraints', ValidateRequest(getAllConstraintsRequestSchema), entityController.getAllConstraints);
entityRouter.put(
    '/constraints/:templateId',
    ValidateRequest(updateConstraintsOfTemplateRequestSchema),
    entityValidatorController.validateConstraintsOfTemplate,
    entityController.updateConstraintsOfTemplate,
);
entityRouter.post(
    '/constraints/enumerate-new-serial-number-fields/:templateId',
    ValidateRequest(enumerateNewSerialNumberFieldsRequestSchema),
    entityController.enumerateNewSerialNumberFields,
);

entityRouter.post(
    '/search/template/:templateId',
    ValidateRequest(searchEntitiesOfTemplateRequestSchema),
    entityValidatorController.validateSearchEntitiesOfTemplateBody,
    entityController.searchEntitiesOfTemplate,
);
entityRouter.post('/count', ValidateRequest(countEntitiesOfTemplatesRequestSchema), entityController.getEntitiesCountByTemplates);
entityRouter.post(
    '/count/user-entity-id',
    ValidateRequest(countEntitiesOfTemplatesByUserEntityIdRequestSchema),
    entityController.countEntitiesOfTemplatesByUserEntityId,
);
entityRouter.post(
    '/search/templates',
    ValidateRequest(searchEntitiesByTemplatesSchema),
    entityValidatorController.validateSearchByTemplatesBody,
    entityController.searchEntitiesByTemplates,
);
entityRouter.post(
    '/search/batch',
    ValidateRequest(searchEntitiesBatchRequestSchema),
    entityValidatorController.validateSearchBatchBody,
    entityController.searchEntitiesBatch,
);
entityRouter.post('/search/location', ValidateRequest(searchEntitiesByLocation), entityController.searchEntitiesByLocation);

entityRouter.put('/update-enum-field/:id', ValidateRequest(updateEnumFieldRequestSchema), entityController.updateEnumFieldValue);
entityRouter.put('/convert-fields-to-plural/:id', ValidateRequest(convertFieldsToPluralRequestSchema), entityController.convertFieldsToPlural);
entityRouter.get('/get-is-field-used/:id', ValidateRequest(getIfValueFieldIsUsedRequestSchema), entityController.getIsFieldUsed);

entityRouter.post('/rules/dependant', ValidateRequest(getDependentRulesRequestSchema), entityController.getDependentRules);

entityRouter.post(
    '/expanded/:id',
    ValidateRequest(getExpandedGraphByIdRequestSchema),
    entityValidatorController.validateFilterBatchBody,
    entityController.getExpandedGraphById,
);
entityRouter.post('/chart/:templateId', ValidateRequest(chartSchema), entityController.getChartOfTemplate);
entityRouter.post('/', ValidateRequest(createEntityRequestSchema), entityValidatorController.validateEntityRequest, entityController.createEntity);
entityRouter.get('/:id', ValidateRequest(getEntityByIdRequestSchema), entityController.getEntityById);
entityRouter.post('/ids', ValidateRequest(getEntitiesByIdsRequestSchema), entityController.getEntitiesByIds);
entityRouter.delete('/', ValidateRequest(deleteEntitiesByTemplateIdRequestSchema), entityController.deleteEntitiesByTemplateId);
entityRouter.post('/delete/bulk', ValidateRequest(deleteEntitiesByIdsRequestSchema), entityController.deleteEntityInstances);

entityRouter.post(
    '/get/multiple-select',
    ValidateRequest(getSelectedEntitiesRequestSchema),
    entityValidatorController.validateTemplateExistence,
    entityController.getSelectedEntities,
);

entityRouter.put(
    '/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    entityValidatorController.validateEntityRequest,
    entityController.updateEntityById,
);

entityRouter.patch(
    '/convertToRelationshipField',
    ValidateRequest(convertToRelationshipFieldRequestSchema),
    entityController.convertToRelationshipField,
);
entityRouter.patch('/:id/status', ValidateRequest(updateEntityStatusByIdRequestSchema), entityController.updateStatusById);
entityRouter.patch(
    '/deletePropertiesOfTemplate/:templateId',
    ValidateRequest(deletePropertiesOfTemplateRequestSchema),
    entityController.deletePropertiesOfTemplate,
);

export default entityRouter;
