import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import FilesController from './controller';
import { getPreviewSchema } from './validator.schema';

const filesRouter: Router = Router();
const controller = createController(FilesController);

filesRouter.get('/:fileId', ValidateRequest(getPreviewSchema), controller.getFilePreview);

export default filesRouter;
