import { Router } from 'express';
import EntityController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { validateEntity, validateConstraintsOfTemplate, validateSearchBatchBody, validateSearchEntitiesOfTemplateBody } from './validator.template';
import {
    deleteEntityByIdRequestSchema,
    deleteEntitiesByTemplateIdRequestSchema,
    createEntityRequestSchema,
    getEntityByIdRequestSchema,
    updateEntityByIdRequestSchema,
    getConstraintsOfTemplateRequestSchema,
    getAllConstraintsRequestSchema,
    updateEntityStatusByIdRequestSchema,
    updateConstraintsOfTemplateRequestSchema,
    getExpandedEntityByIdRequestSchema,
    searchEntitiesBatchRequestSchema,
    searchEntitiesOfTemplateRequestSchema,
    updateNewSerialNumberFieldsRequestSchema,
} from './validator.schema';

const entityRouter: Router = Router();

entityRouter.get(
    '/constraints/:templateId',
    ValidateRequest(getConstraintsOfTemplateRequestSchema),
    wrapController(EntityController.getConstraintsOfTemplate),
);
entityRouter.get('/constraints', ValidateRequest(getAllConstraintsRequestSchema), wrapController(EntityController.getAllConstraints));
entityRouter.put(
    '/constraints/:templateId',
    ValidateRequest(updateConstraintsOfTemplateRequestSchema),
    wrapMiddleware(validateConstraintsOfTemplate),
    wrapController(EntityController.updateConstraintsOfTemplate),
);
entityRouter.put(
    '/constraints/newSerialNumberFields/:templateId',
    ValidateRequest(updateNewSerialNumberFieldsRequestSchema),
    // wrapMiddleware(validateConstraintsOfTemplate),
    wrapController(EntityController.updateNewSerialNumberFields),
);

entityRouter.post(
    '/search/template/:templateId',
    ValidateRequest(searchEntitiesOfTemplateRequestSchema),
    wrapMiddleware(validateSearchEntitiesOfTemplateBody),
    wrapController(EntityController.searchEntitiesOfTemplate),
);
entityRouter.post(
    '/search/batch',
    ValidateRequest(searchEntitiesBatchRequestSchema),
    wrapMiddleware(validateSearchBatchBody),
    wrapController(EntityController.searchEntitiesBatch),
);

entityRouter.post('/expanded/:id', ValidateRequest(getExpandedEntityByIdRequestSchema), wrapController(EntityController.getExpandedEntityById));
entityRouter.post('/', ValidateRequest(createEntityRequestSchema), wrapMiddleware(validateEntity), wrapController(EntityController.createEntity));
entityRouter.get('/:id', ValidateRequest(getEntityByIdRequestSchema), wrapController(EntityController.getEntityById));
entityRouter.delete('/:id', ValidateRequest(deleteEntityByIdRequestSchema), wrapController(EntityController.deleteEntityById));
entityRouter.delete('/', ValidateRequest(deleteEntitiesByTemplateIdRequestSchema), wrapController(EntityController.deleteEntitiesByTemplateId));
entityRouter.put(
    '/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    wrapMiddleware(validateEntity),
    wrapController(EntityController.updateEntityById),
);
entityRouter.patch('/:id/status', ValidateRequest(updateEntityStatusByIdRequestSchema), wrapController(EntityController.updateStatusById));

export default entityRouter;
