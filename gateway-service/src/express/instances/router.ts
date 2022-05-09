import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../../config';
import { wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    validateUserCanCreateEntityInstance,
    validateUserCanCreateRelationshipInstance,
    validateUserCanSearchEntityInstances,
    validateUserCanUpdateGetOrDeleteEntityInstance,
    validateUserCanUpdateOrDeleteRelationshipInstance,
} from './middlewares';
import {
    deleteEntityByIdRequestSchema,
    createEntityRequestSchema,
    getEntityByIdRequestSchema,
    updateEntityByIdRequestSchema,
    getEntitiesRequestSchema,
    createRelationshipRequestSchema,
    updateRelationshipByIdRequestSchema,
    deleteRelationshipByIdRequestSchema,
} from './validator.schema';

const { instanceManager } = config;
const InstanceManagerProxy = createProxyMiddleware({
    target: instanceManager.uri,
    onProxyReq: fixRequestBody,
    proxyTimeout: instanceManager.requestTimeout,
});

const InstancesRouter: Router = Router();

// entities (Instances)
InstancesRouter.post(
    '/entities/search',
    ValidateRequest(getEntitiesRequestSchema),
    wrapMiddleware(validateUserCanSearchEntityInstances),
    InstanceManagerProxy,
);

InstancesRouter.get(
    '/entities/:id',
    ValidateRequest(getEntityByIdRequestSchema),
    wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance),
    InstanceManagerProxy,
);
InstancesRouter.post(
    '/entities',
    ValidateRequest(createEntityRequestSchema),
    wrapMiddleware(validateUserCanCreateEntityInstance),
    InstanceManagerProxy,
);
InstancesRouter.put(
    '/entities/:id',
    ValidateRequest(updateEntityByIdRequestSchema),
    wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance),
    InstanceManagerProxy,
);
InstancesRouter.delete(
    '/entities/:id',
    ValidateRequest(deleteEntityByIdRequestSchema),
    wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance),
    InstanceManagerProxy,
);

// relationships (Instances)
InstancesRouter.post(
    '/relationships',
    ValidateRequest(createRelationshipRequestSchema),
    wrapMiddleware(validateUserCanCreateRelationshipInstance),
    InstanceManagerProxy,
);
InstancesRouter.put(
    '/relationships/:id',
    ValidateRequest(updateRelationshipByIdRequestSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance),
    InstanceManagerProxy,
);
InstancesRouter.delete(
    '/relationships/:id',
    ValidateRequest(deleteRelationshipByIdRequestSchema),
    wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance),
    InstanceManagerProxy,
);

export default InstancesRouter;
