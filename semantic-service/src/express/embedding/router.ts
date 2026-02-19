import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import EmbeddingController from './controller';
import { rerank, search } from './validator.schema';

const embeddingRouter: Router = Router();

const controller = createController(EmbeddingController);

embeddingRouter.post('/search', ValidateRequest(search), controller.search);

embeddingRouter.post('/rerank', ValidateRequest(rerank), controller.rerank);

embeddingRouter.post('/createIndex', controller.createIndex);

embeddingRouter.post('/deleteIndex', controller.deleteIndex);

export default embeddingRouter;
