import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import EntityController from './controller';
import {
    createEntityRequestSchema,
    deleteEntitiesByTemplateIdRequestSchema,
    deleteEntityByIdRequestSchema,
    enumerateNewSerialNumberFieldsRequestSchema,
    getAllConstraintsRequestSchema,
    getConstraintsOfTemplateRequestSchema,
    getEntitiesByIdsRequestSchema,
    getEntityByIdRequestSchema,
    getExpandedGraphByIdRequestSchema,
    getIfValuefieldIsUsedRequestSchema,
    searchEntitiesBatchRequestSchema,
    searchEntitiesOfTemplateRequestSchema,
    updateConstraintsOfTemplateRequestSchema,
    updateEntityByIdRequestSchema,
    updateEntityStatusByIdRequestSchema,
    updateEnumFieldRequestSchema,
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
entityRouter.post(
    '/search/batch',
    ValidateRequest(searchEntitiesBatchRequestSchema),
    entityValidatorController.validateSearchBatchBody,
    entityController.searchEntitiesBatch,
);

entityRouter.put('/update-enum-field/:id', ValidateRequest(updateEnumFieldRequestSchema), entityController.updateEnumFieldValue);
entityRouter.get('/get-is-field-used/:id', ValidateRequest(getIfValuefieldIsUsedRequestSchema), entityController.getIsFieldUsed);

entityRouter.post(
    '/expanded/:id',
    ValidateRequest(getExpandedGraphByIdRequestSchema),
    entityValidatorController.validateFilterBatchBody,
    entityController.getExpandedGraphById,
);

entityRouter.post('/', ValidateRequest(createEntityRequestSchema), entityValidatorController.validateEntityRequest, entityController.createEntity);
entityRouter.get('/:id', ValidateRequest(getEntityByIdRequestSchema), entityController.getEntityById);
entityRouter.post('/ids', ValidateRequest(getEntitiesByIdsRequestSchema), entityController.getEntitiesByIds);
entityRouter.delete('/:id', ValidateRequest(deleteEntityByIdRequestSchema), entityController.deleteEntityById);
entityRouter.delete('/', ValidateRequest(deleteEntitiesByTemplateIdRequestSchema), entityController.deleteEntitiesByTemplateId);
entityRouter.put(
    '/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    entityValidatorController.validateEntityRequest,
    entityController.updateEntityById,
);
entityRouter.patch('/:id/status', ValidateRequest(updateEntityStatusByIdRequestSchema), entityController.updateStatusById);

export default entityRouter;
