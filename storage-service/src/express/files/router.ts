import { Router } from 'express';
import { FilesController } from './controller';
import { wrapController } from '../../utils/express';
import { UploadToMinio } from '../../utils/minio';
import { defaultSchema, uploadFileRequestSchema } from './validator.schema';
import { ValidateRequest } from '../../utils/joi';

import { config } from '../../config';

const { fileKeyName } = config.multer;

const filesRouter: Router = Router();

filesRouter.get('/', wrapController(FilesController.listFiles));
filesRouter.post('/', UploadToMinio(fileKeyName), ValidateRequest(uploadFileRequestSchema), wrapController(FilesController.uploadFile));
filesRouter.get('/:path', ValidateRequest(defaultSchema), wrapController(FilesController.downloadFile));
filesRouter.get('/:path/stats', ValidateRequest(defaultSchema), wrapController(FilesController.fileStat));
filesRouter.delete('/:path', ValidateRequest(defaultSchema), wrapController(FilesController.deleteFile));

export { filesRouter };
