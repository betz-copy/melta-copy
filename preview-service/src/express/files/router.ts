import { Router } from 'express';
import { FilesController } from './controller';
import { wrapController } from '../../utils/express';
import { getPreviewSchema } from './validator.schema';
import { ValidateRequest } from '../../utils/joi';

const filesRouter: Router = Router();
filesRouter.get('/:fileId/:needsConversion', ValidateRequest(getPreviewSchema), wrapController(FilesController.createFilePreview));

export { filesRouter };
