import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import ConfigController from './controller';
import { createCategoryOrderConfigSchema, getAllConfigsSchema, getConfigByTypeSchema, updateCategoryOrderConfigSchema } from './validator.schema';

const configRouter: Router = Router();

const controller = createController(ConfigController);

configRouter.get('/all', ValidateRequest(getAllConfigsSchema), controller.getConfigs);

configRouter.get('/:type', ValidateRequest(getConfigByTypeSchema), controller.getConfigByType);

configRouter.put(`/categoryOrder/:configId`, ValidateRequest(updateCategoryOrderConfigSchema), controller.updateCategoryOrder);

configRouter.post(`/categoryOrder`, ValidateRequest(createCategoryOrderConfigSchema), controller.createCategoryOrder);

export default configRouter;
