import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import * as multer from 'multer';
import config from '../../config';
import { wrapController, wrapMiddleware } from '../../utils/express';
import {
    validateUserCanCreateEntityInstance,
    validateUserCanCreateRelationshipInstance,
    validateUserCanGetExpandedEntity,
    validateUserCanSearchEntityInstances,
    validateUserCanUpdateGetOrDeleteEntityInstance,
    validateUserCanUpdateOrDeleteRelationshipInstance,
} from './middlewares';
import { validateUserIsTemplateManager } from '../permissions/validateAuthorizationMiddleware';
import InstancesController from './controller';
import { createEntityInstanceSchema, deleteEntityInstanceSchema, updateEntityInstanceSchema, updateEntityStatusSchema } from './validator.schema';
import ValidateRequest from '../../utils/joi';

const { instanceManager } = config;
const InstanceManagerProxy = createProxyMiddleware({
    target: instanceManager.uri,
    onProxyReq: fixRequestBody,
    proxyTimeout: instanceManager.requestTimeout,
});

const InstancesRouter: Router = Router();

// entities (Instances)
InstancesRouter.post('/entities/search', wrapMiddleware(validateUserCanSearchEntityInstances), InstanceManagerProxy);

InstancesRouter.get('/entities/:id', wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance), InstanceManagerProxy);
InstancesRouter.post(
    '/entities/expanded/:id',
    wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance),
    wrapMiddleware(validateUserCanGetExpandedEntity),
    InstanceManagerProxy,
);
InstancesRouter.post(
    '/entities',
    multer({ dest: config.service.uploadsFolderPath }).any(),
    ValidateRequest(createEntityInstanceSchema),
    wrapMiddleware(validateUserCanCreateEntityInstance),
    wrapController(InstancesController.createEntityInstance),
);
InstancesRouter.put(
    '/entities/:id',
    multer({ dest: config.service.uploadsFolderPath }).any(),
    ValidateRequest(updateEntityInstanceSchema),
    wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance),
    wrapController(InstancesController.updateEntityInstance),
);
InstancesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityInstanceSchema),
    wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance),
    wrapController(InstancesController.deleteEntityInstance),
);
InstancesRouter.patch(
    '/entities/:id/status',
    ValidateRequest(updateEntityStatusSchema),
    wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance),
    wrapController(InstancesController.updateEntityStatus),
);

// relationships (Instances)
InstancesRouter.get('/relationships/count', wrapMiddleware(validateUserIsTemplateManager), InstanceManagerProxy);
InstancesRouter.post(
    '/relationships',
    wrapMiddleware(validateUserCanCreateRelationshipInstance),
    wrapController(InstancesController.createRelationshipInstance),
);
InstancesRouter.put('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance), InstanceManagerProxy);
InstancesRouter.delete(
    '/relationships/:id',
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance),
    wrapController(InstancesController.deleteEntityInstance),
);

export default InstancesRouter;
