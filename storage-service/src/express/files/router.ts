import { Router } from 'express';
import { createController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { MinioMulter } from '../../utils/minio';
import FilesController from './controller';
import { bulkFilesRequestSchema, defaultSchema, uploadFileRequestSchema, uploadFilesRequestSchema } from './validator.schema';

const filesRouter: Router = Router();

const filesController = createController(FilesController);
const multerController = createController(MinioMulter);

filesRouter.get('/zip/:path', ValidateRequest(defaultSchema), filesController('downloadZip'));

filesRouter.get('/', filesController('listFiles'));
filesRouter.get('/:path', ValidateRequest(defaultSchema), filesController('downloadFile'));
filesRouter.get('/:path/stats', ValidateRequest(defaultSchema), filesController('fileStat'));

filesRouter.post('/delete-bulk', ValidateRequest(bulkFilesRequestSchema), filesController('deleteFiles'));
filesRouter.delete('/:path', ValidateRequest(defaultSchema), filesController('deleteFile'));

filesRouter.post('/duplicate/:path', ValidateRequest(defaultSchema), filesController('duplicateFile'));
filesRouter.post('/duplicate-bulk', ValidateRequest(bulkFilesRequestSchema), filesController('duplicateFiles'));

filesRouter.post('/bulk', multerController('uploadBulkToMinio'), ValidateRequest(uploadFilesRequestSchema), filesController('uploadFiles'));
filesRouter.post('/', multerController('uploadToMinio'), ValidateRequest(uploadFileRequestSchema), filesController('uploadFile'));

export { filesRouter };
