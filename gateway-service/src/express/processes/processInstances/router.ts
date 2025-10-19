import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';

import InstancesController from './controller';
import {
    createProcessInstanceSchema,
    deleteProcessInstanceSchema,
    searchProcessInstancesSchema,
    updateProcessInstanceSchema,
    getProcessInstanceSchema,
    archivedProcessStatusSchema,
} from './validator.schema';
import { AuthorizerControllerMiddleware } from '../../../utils/authorizer';
import busboyMiddleware from '../../../utils/busboy/busboyMiddleware';

const InstancesRouter: Router = Router();

const InstancesControllerMiddleware = createController(InstancesController);

InstancesRouter.get('/:id', ValidateRequest(getProcessInstanceSchema), InstancesControllerMiddleware.getProcessInstance);
InstancesRouter.post(
    '/',
    busboyMiddleware,
    ValidateRequest(createProcessInstanceSchema),
    AuthorizerControllerMiddleware.userCanWriteProcesses,
    InstancesControllerMiddleware.createProcessInstance,
);
InstancesRouter.post('/search', ValidateRequest(searchProcessInstancesSchema), InstancesControllerMiddleware.searchProcessInstances);
InstancesRouter.put(
    '/:id',
    busboyMiddleware,
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
