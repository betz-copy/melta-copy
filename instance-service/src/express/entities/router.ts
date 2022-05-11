import { Router } from 'express';
import EntityController from './controller';
import { wrapController, wrapMiddleware, wrapMiddlewareSync } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { addStringFieldsAndNormalizeDateValues, validateEntity } from './validator.template';
import {
    deleteEntityByIdRequestSchema,
    deleteEntityByTemplateIdRequestSchema,
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
    wrapMiddlewareSync(addStringFieldsAndNormalizeDateValues),
    wrapController(EntityController.createEntity),
);
entityRouter.post('/search', ValidateRequest(getEntitiesRequestSchema), wrapController(EntityController.getEntities));
entityRouter.get('/:id', ValidateRequest(getEntityByIdRequestSchema), wrapController(EntityController.getEntityById));
entityRouter.delete('/:id', ValidateRequest(deleteEntityByIdRequestSchema), wrapController(EntityController.deleteEntityById));
entityRouter.delete('/', ValidateRequest(deleteEntityByTemplateIdRequestSchema), wrapController(EntityController.deleteEntitiesByTemplateId));
entityRouter.put(
    '/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    wrapMiddleware(validateEntity),
    wrapMiddlewareSync(addStringFieldsAndNormalizeDateValues),
    wrapController(EntityController.updateEntityById),
);

export default entityRouter;
