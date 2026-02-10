import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import busboyMiddleware from '../../utils/minio/busboy';
import FilesController, { workspaceIdInHeader } from './controller';
import { bulkFilesRequestSchema, defaultSchema, uploadFileRequestSchema, uploadFilesRequestSchema, workspaceSchema } from './validator.schema';

const filesRouter: Router = Router();

const filesController = createController(FilesController);

filesRouter.get('/zip/:path/:workspaceId', ValidateRequest(workspaceSchema), workspaceIdInHeader);
filesRouter.get('/zip/:path', ValidateRequest(defaultSchema), filesController.downloadZip);

filesRouter.get('/', filesController.listFiles);
filesRouter.get('/:path/:workspaceId', ValidateRequest(workspaceSchema), workspaceIdInHeader);
filesRouter.get('/:path', ValidateRequest(defaultSchema), filesController.downloadFile);
filesRouter.get('/:path/stats', ValidateRequest(defaultSchema), filesController.fileStat);

filesRouter.post('/delete-bulk', ValidateRequest(bulkFilesRequestSchema), filesController.deleteFiles);
filesRouter.delete('/:path', ValidateRequest(defaultSchema), filesController.deleteFile);

filesRouter.post('/duplicate/:path', ValidateRequest(defaultSchema), filesController.duplicateFile);
filesRouter.post('/duplicate-bulk', ValidateRequest(bulkFilesRequestSchema), filesController.duplicateFiles);

filesRouter.post('/', busboyMiddleware, ValidateRequest(uploadFileRequestSchema), filesController.uploadFile);
filesRouter.post('/bulk', busboyMiddleware, ValidateRequest(uploadFilesRequestSchema), filesController.uploadFiles);

export default filesRouter;
