import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import SemanticController from './controller';
import { rerank, search } from './validator.schema';

const semanticRouter: Router = Router();

const controller = createController(SemanticController);

semanticRouter.post('/search', ValidateRequest(search), controller.search);
semanticRouter.post('/rerank', ValidateRequest(rerank), controller.rerank);
semanticRouter.post('/createIndex', controller.createIndex);
semanticRouter.post('/deleteIndex', controller.deleteIndex);

export default semanticRouter;
