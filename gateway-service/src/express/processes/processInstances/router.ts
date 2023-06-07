import { Router } from 'express';
import * as multer from 'multer';
import config from '../../../config';
import { wrapController, wrapMiddleware } from '../../../utils/express';

import InstancesController from './controller';
import {
    createProcessInstanceSchema,
    deleteProcessInstanceSchema,
    searchProcessInstancesSchema,
    updateProcessInstanceSchema,
    getProcessInstanceSchema,
} from './validator.schema';
import ValidateRequest from '../../../utils/joi';
import { validateUserIsProcessesManager } from '../../permissions/validateAuthorizationMiddleware';

const InstancesRouter: Router = Router();

InstancesRouter.get('/:id', ValidateRequest(getProcessInstanceSchema), wrapController(InstancesController.getProcessInstance));
InstancesRouter.post(
    '/',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(createProcessInstanceSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    wrapController(InstancesController.createProcessInstance),
);
InstancesRouter.post('/search', ValidateRequest(searchProcessInstancesSchema), wrapController(InstancesController.searchProcessInstances));
InstancesRouter.put(
    '/:id',
    multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateProcessInstanceSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    wrapController(InstancesController.updateProcessInstance),
);
InstancesRouter.delete(
    '/:id',
    ValidateRequest(deleteProcessInstanceSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    wrapController(InstancesController.deleteProcessInstance),
);

export default InstancesRouter;
