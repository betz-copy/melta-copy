import { Router } from 'express';
import { createController } from '../../utils/express';
import ConfigController from './controller';
import ValidateRequest from '../../utils/joi';
import { createOrderConfigSchema, getAllConfigsSchema, getOrderConfigByNameSchema, updateOrderConfigSchema } from './validator.schema';

const configRouter: Router = Router();

const controller = createController(ConfigController);

configRouter.get('/all', ValidateRequest(getAllConfigsSchema), controller.getConfigs);

configRouter.get('/order/:configName', ValidateRequest(getOrderConfigByNameSchema), controller.getOrderConfigByName);

configRouter.put(`/order/:configId`, ValidateRequest(updateOrderConfigSchema), controller.updateOrder);

configRouter.post(`/order`, ValidateRequest(createOrderConfigSchema), controller.createOrder);

export default configRouter;
