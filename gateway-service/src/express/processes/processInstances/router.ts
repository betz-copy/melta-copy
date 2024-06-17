import { Router } from 'express';
import multer from 'multer';
import config from '../../../config';
import { createWorkspacesController, wrapMiddleware } from '../../../utils/express';

import InstancesController from './controller';
import {
    createProcessInstanceSchema,
    deleteProcessInstanceSchema,
    searchProcessInstancesSchema,
    updateProcessInstanceSchema,
    getProcessInstanceSchema,
    archivedProcessStatusSchema,
} from './validator.schema';
import ValidateRequest from '../../../utils/joi';
import { validateUserIsProcessesManager } from '../../permissions/validateAuthorizationMiddleware';

const InstancesRouter: Router = Router();

const InstancesControllerMiddleware = createWorkspacesController(InstancesController);

InstancesRouter.get('/:id', ValidateRequest(getProcessInstanceSchema), InstancesControllerMiddleware('getProcessInstance'));
InstancesRouter.post(
    '/',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(createProcessInstanceSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    InstancesControllerMiddleware('createProcessInstance'),
);
InstancesRouter.post('/search', ValidateRequest(searchProcessInstancesSchema), InstancesControllerMiddleware('searchProcessInstances'));
InstancesRouter.put(
    '/:id',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateProcessInstanceSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    InstancesControllerMiddleware('updateProcessInstance'),
);
InstancesRouter.delete(
    '/:id',
    ValidateRequest(deleteProcessInstanceSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    InstancesControllerMiddleware('deleteProcessInstance'),
);
InstancesRouter.patch(
    '/archive/:id',
    ValidateRequest(archivedProcessStatusSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    InstancesControllerMiddleware('archiveProcess'),
);

export default InstancesRouter;
