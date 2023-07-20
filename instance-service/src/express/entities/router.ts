import { Router } from 'express';
import EntityController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { validateEntity, validateConstraintsOfTemplate, validateSearchBody } from './validator.template';
import {
    deleteEntityByIdRequestSchema,
    deleteEntitiesByTemplateIdRequestSchema,
    createEntityRequestSchema,
    getEntityByIdRequestSchema,
    updateEntityByIdRequestSchema,
    getEntitiesRequestSchema,
    getConstraintsOfTemplateRequestSchema,
    getAllConstraintsRequestSchema,
    updateEntityStatusByIdRequestSchema,
    updateConstraintsOfTemplateRequestSchema,
    getExpandedEntityByIdRequestSchema,
    searchEntitiesBatchRequestSchema,
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

entityRouter.post('/search', ValidateRequest(getEntitiesRequestSchema), wrapController(EntityController.searchEntities));
entityRouter.post(
    '/search/batch',
    ValidateRequest(searchEntitiesBatchRequestSchema),
    wrapMiddleware(validateSearchBody),
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
