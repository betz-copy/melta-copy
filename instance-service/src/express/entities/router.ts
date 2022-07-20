import { Router } from 'express';
import EntityController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { addStringFieldsAndNormalizeDateValues, validateEntity } from './validator.template';
import {
    deleteEntityByIdRequestSchema,
    deleteEntitiesByTemplateIdRequestSchema,
    createEntityRequestSchema,
    getEntityByIdRequestSchema,
    updateEntityByIdRequestSchema,
    getEntitiesRequestSchema,
    updateEntityStatusByIdRequestSchema,
    getExpandedEntityByIdRequestSchema,
} from './validator.schema';

const entityRouter: Router = Router();

entityRouter.post(
    '/',
    ValidateRequest(createEntityRequestSchema),
    wrapMiddleware(validateEntity),
    addStringFieldsAndNormalizeDateValues,
    wrapController(EntityController.createEntity),
);
entityRouter.post('/search', ValidateRequest(getEntitiesRequestSchema), wrapController(EntityController.getEntities));
entityRouter.post('/expanded/:id', ValidateRequest(getExpandedEntityByIdRequestSchema), wrapController(EntityController.getExpandedEntityById));
entityRouter.get('/:id', ValidateRequest(getEntityByIdRequestSchema), wrapController(EntityController.getEntityById));
entityRouter.delete('/:id', ValidateRequest(deleteEntityByIdRequestSchema), wrapController(EntityController.deleteEntityById));
entityRouter.delete('/', ValidateRequest(deleteEntitiesByTemplateIdRequestSchema), wrapController(EntityController.deleteEntitiesByTemplateId));
entityRouter.put(
    '/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    wrapMiddleware(validateEntity),
    addStringFieldsAndNormalizeDateValues,
    wrapController(EntityController.updateEntityById),
);
entityRouter.patch('/:id/status', ValidateRequest(updateEntityStatusByIdRequestSchema), wrapController(EntityController.updateStatusById));

export default entityRouter;
