import { Router } from 'express';
import { createController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { FilesController } from './controller';
import { getPreviewSchema } from './validator.schema';

const filesRouter: Router = Router();
const controller = createController(FilesController);

filesRouter.get('/:fileId', ValidateRequest(getPreviewSchema), controller('getFilePreview'));

export { filesRouter };
