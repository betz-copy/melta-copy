import { Router } from 'express';
import { fixRequestBody } from 'http-proxy-middleware';
import { createWorkspacesProxyMiddleware } from '../../utils/express';
import config from '../../config';

const { activityLogService: activityLog } = config;

const ActivityLogProxy = createWorkspacesProxyMiddleware({
    target: activityLog.url,
    onProxyReq: fixRequestBody,
    proxyTimeout: activityLog.requestTimeout,
});

const ActivityLogRouter: Router = Router();

ActivityLogRouter.get('*', ActivityLogProxy);

export default ActivityLogRouter;
