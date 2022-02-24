import { Router } from 'express';
import { FilesController } from './controller';
import { wrapController } from '../../utils/express';
import { UploadToMinio } from '../../utils/minio';
import { defaultSchema, uploadFileRequestSchema } from './validator.schema';
import { ValidateRequest } from '../../utils/joi';

import { config } from '../../config';

const { fileKeyName } = config.multer;

const filesRouter: Router = Router();

filesRouter.post('/uploadFile', UploadToMinio(fileKeyName), ValidateRequest(uploadFileRequestSchema), wrapController(FilesController.uploadFile));
filesRouter.get('/downloadFile/:path', ValidateRequest(defaultSchema), wrapController(FilesController.downloadFile));

filesRouter.get('/file/:path', ValidateRequest(defaultSchema), wrapController(FilesController.fileStat));
filesRouter.get('/list', wrapController(FilesController.listFiles));

export { filesRouter };
