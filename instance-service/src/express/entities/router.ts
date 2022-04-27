import { Router } from 'express';
import EntityController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import {
    deleteEntityByIdRequestSchema,
    deleteEntityByTemplateIdRequestSchema,
    createEntityRequestSchema,
    getEntityByIdRequestSchema,
    updateEntityByIdRequestSchema,
    getEntitiesRequestSchema,
} from './validator.schema';
import ValidateRequest from '../../utils/joi';
import { validateEntity } from './validator.template';

const entityRouter: Router = Router();

entityRouter.post('/', ValidateRequest(createEntityRequestSchema), wrapMiddleware(validateEntity), wrapController(EntityController.createEntity));
entityRouter.post('/filter/:templateId', ValidateRequest(getEntitiesRequestSchema), wrapController(EntityController.getEntities));
entityRouter.get('/:id', ValidateRequest(getEntityByIdRequestSchema), wrapController(EntityController.getEntityById));
entityRouter.delete('/:id', ValidateRequest(deleteEntityByIdRequestSchema), wrapController(EntityController.deleteEntityById));
entityRouter.delete('/', ValidateRequest(deleteEntityByTemplateIdRequestSchema), wrapController(EntityController.deleteEntitiesByTemplateId));
entityRouter.put(
    '/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    wrapMiddleware(validateEntity),
    wrapController(EntityController.updateEntityById),
);

export default entityRouter;
