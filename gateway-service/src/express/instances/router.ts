import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../../config';
import { wrapMiddleware } from '../../utils/express';
import {
    validateUserCanCreateEntityInstance,
    validateUserCanCreateRelationshipInstance,
    validateUserCanSearchEntityInstances,
    validateUserCanUpdateGetOrDeleteEntityInstance,
    validateUserCanUpdateOrDeleteRelationshipInstance,
} from './middlewares';

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
InstancesRouter.post('/entities', wrapMiddleware(validateUserCanCreateEntityInstance), InstanceManagerProxy);
InstancesRouter.put('/entities/:id', wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance), InstanceManagerProxy);
InstancesRouter.delete('/entities/:id', wrapMiddleware(validateUserCanUpdateGetOrDeleteEntityInstance), InstanceManagerProxy);

// relationships (Instances)
InstancesRouter.post('/relationships', wrapMiddleware(validateUserCanCreateRelationshipInstance), InstanceManagerProxy);
InstancesRouter.put('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance), InstanceManagerProxy);
InstancesRouter.delete('/relationships/:id', wrapMiddleware(validateUserCanUpdateOrDeleteRelationshipInstance), InstanceManagerProxy);

export default InstancesRouter;
