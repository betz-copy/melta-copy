import { Router } from 'express';
import { FilesController } from './controller';
import { wrapController } from '../../utils/express';
import { UploadBulkToMinio, UploadToMinio } from '../../utils/minio';
import { defaultSchema, uploadFileRequestSchema, uploadFilesRequestSchema, bulkFilesRequestSchema } from './validator.schema';
import { ValidateRequest } from '../../utils/joi';

import { config } from '../../config';

const { fileKeyName, filesKeyName } = config.multer;

const filesRouter: Router = Router();

filesRouter.get('/', wrapController(FilesController.listFiles));
filesRouter.get('/:path', ValidateRequest(defaultSchema), wrapController(FilesController.downloadFile));
filesRouter.get('/:path/stats', ValidateRequest(defaultSchema), wrapController(FilesController.fileStat));

filesRouter.post('/delete-bulk', ValidateRequest(bulkFilesRequestSchema), wrapController(FilesController.deleteFiles));
filesRouter.delete('/:path', ValidateRequest(defaultSchema), wrapController(FilesController.deleteFile));

filesRouter.post('/duplicate/:path', ValidateRequest(defaultSchema), wrapController(FilesController.duplicateFile));
filesRouter.post('/duplicate-bulk', ValidateRequest(bulkFilesRequestSchema), wrapController(FilesController.duplicateFiles));

filesRouter.post('/bulk', UploadBulkToMinio(filesKeyName), ValidateRequest(uploadFilesRequestSchema), wrapController(FilesController.uploadFiles));
filesRouter.post('/', UploadToMinio(fileKeyName), ValidateRequest(uploadFileRequestSchema), wrapController(FilesController.uploadFile));

export { filesRouter };
