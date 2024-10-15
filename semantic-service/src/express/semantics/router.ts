import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import SemanticController from './controller';
import { getNotificationGroupCountRequestSchema } from './validator.schema';

const semanticRouter: Router = Router();

const controller = createController(SemanticController);

semanticRouter.post('/search', ValidateRequest(getNotificationGroupCountRequestSchema), controller.search);
semanticRouter.post('/createIndex', controller.createIndex);
semanticRouter.post('/deleteIndex', controller.deleteIndex);

export default semanticRouter;
