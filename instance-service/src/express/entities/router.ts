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
entityRouter.get('/:id', ValidateRequest(getEntityByIdRequestSchema), wrapController(EntityController.getEntityById));
entityRouter.delete('/:id', ValidateRequest(deleteEntityByIdRequestSchema), wrapController(EntityController.deleteEntityById));
entityRouter.delete(
    '/:templateId',
    ValidateRequest(deleteEntitiesByTemplateIdRequestSchema),
    wrapController(EntityController.deleteEntitiesByTemplateId),
);
entityRouter.put(
    '/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    wrapMiddleware(validateEntity),
    addStringFieldsAndNormalizeDateValues,
    wrapController(EntityController.updateEntityById),
);

export default entityRouter;
