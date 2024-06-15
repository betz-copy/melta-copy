import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import EntityController from './controller';
import {
    createEntityRequestSchema,
    deleteEntitiesByTemplateIdRequestSchema,
    deleteEntityByIdRequestSchema,
    getAllConstraintsRequestSchema,
    getConstraintsOfTemplateRequestSchema,
    getEntityByIdRequestSchema,
    getExpandedEntityByIdRequestSchema,
    searchEntitiesBatchRequestSchema,
    searchEntitiesOfTemplateRequestSchema,
    updateConstraintsOfTemplateRequestSchema,
    updateEntityByIdRequestSchema,
    updateEntityStatusByIdRequestSchema,
} from './validator.schema';
import EntityValidator from './validator.template';

const entityRouter: Router = Router();

const entityController = createController(EntityController);
const entityValidatorController = createController(EntityValidator);

entityRouter.get('/constraints/:templateId', ValidateRequest(getConstraintsOfTemplateRequestSchema), entityController('getConstraintsOfTemplate'));
entityRouter.get('/constraints', ValidateRequest(getAllConstraintsRequestSchema), entityController('getAllConstraints'));
entityRouter.put(
    '/constraints/:templateId',
    ValidateRequest(updateConstraintsOfTemplateRequestSchema),
    entityValidatorController('validateConstraintsOfTemplate'),
    entityController('updateConstraintsOfTemplate'),
);
entityRouter.post(
    '/search/template/:templateId',
    ValidateRequest(searchEntitiesOfTemplateRequestSchema),
    entityValidatorController('validateSearchEntitiesOfTemplateBody'),
    entityController('searchEntitiesOfTemplate'),
);
entityRouter.post(
    '/search/batch',
    ValidateRequest(searchEntitiesBatchRequestSchema),
    entityValidatorController('validateSearchBatchBody'),
    entityController('searchEntitiesBatch'),
);
entityRouter.post('/expanded/:id', ValidateRequest(getExpandedEntityByIdRequestSchema), entityController('getExpandedEntityById'));
entityRouter.post('/', ValidateRequest(createEntityRequestSchema), entityValidatorController('validateEntity'), entityController('createEntity'));
entityRouter.get('/:id', ValidateRequest(getEntityByIdRequestSchema), entityController('getEntityById'));
entityRouter.delete('/:id', ValidateRequest(deleteEntityByIdRequestSchema), entityController('deleteEntityById'));
entityRouter.delete('/', ValidateRequest(deleteEntitiesByTemplateIdRequestSchema), entityController('deleteEntitiesByTemplateId'));
entityRouter.put(
    '/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    entityValidatorController('validateEntity'),
    entityController('updateEntityById'),
);
entityRouter.patch('/:id/status', ValidateRequest(updateEntityStatusByIdRequestSchema), entityController('updateStatusById'));

export default entityRouter;
