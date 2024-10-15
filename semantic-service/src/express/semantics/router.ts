import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { getNotificationsRequestSchema } from './validator.schema';
import SemanticController from './controller';

const semanticRouter: Router = Router();

const controller = createController(SemanticController);

semanticRouter.post('/search', ValidateRequest(getNotificationsRequestSchema), controller.search);
semanticRouter.post('/createIndex', controller.createIndex);
semanticRouter.post('/deleteIndex', controller.deleteIndex);
semanticRouter.post('/initIndex', controller.initIndex);

export default semanticRouter;
