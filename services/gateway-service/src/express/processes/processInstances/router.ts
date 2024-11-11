import { Router } from 'express';
import multer from 'multer';
import config from '../../../config';
import { createWorkspacesController, wrapMulter } from '../../../utils/express';

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
import { AuthorizerControllerMiddleware } from '../../../utils/authorizer';

const InstancesRouter: Router = Router();

const InstancesControllerMiddleware = createWorkspacesController(InstancesController);

InstancesRouter.get('/:id', ValidateRequest(getProcessInstanceSchema), InstancesControllerMiddleware.getProcessInstance);
InstancesRouter.post(
    '/',
    wrapMulter(multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any()),
    ValidateRequest(createProcessInstanceSchema),
    AuthorizerControllerMiddleware.userCanWriteProcesses,
    InstancesControllerMiddleware.createProcessInstance,
);
InstancesRouter.post('/search', ValidateRequest(searchProcessInstancesSchema), InstancesControllerMiddleware.searchProcessInstances);
InstancesRouter.put(
    '/:id',
    wrapMulter(multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any()),
    ValidateRequest(updateProcessInstanceSchema),
    AuthorizerControllerMiddleware.userCanWriteProcesses,
    InstancesControllerMiddleware.updateProcessInstance,
);
InstancesRouter.delete(
    '/:id',
    ValidateRequest(deleteProcessInstanceSchema),
    AuthorizerControllerMiddleware.userCanWriteProcesses,
    InstancesControllerMiddleware.deleteProcessInstance,
);
InstancesRouter.patch(
    '/archive/:id',
    ValidateRequest(archivedProcessStatusSchema),
    AuthorizerControllerMiddleware.userCanWriteProcesses,
    InstancesControllerMiddleware.archiveProcess,
);

export default InstancesRouter;
