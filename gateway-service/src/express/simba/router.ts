import { fixRequestBody, createProxyMiddleware } from 'http-proxy-middleware';
import { Router } from 'express';
import config from '../../config';

const {
    templateService: {
        url: templateServiceUrl,
        requestTimeout: templateServiceRequestTimeout,
        entities: { baseChildTemplatesRoute },
    },
    instanceService: { url: instanceServiceUrl, requestTimeout: instanceServiceRequestTimeout },
} = config;

const simbaRouter: Router = Router();

const simbaTemplateProxy = createProxyMiddleware({
    target: `${templateServiceUrl}${baseChildTemplatesRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
    proxyTimeout: templateServiceRequestTimeout,
});

const simbaEntityProxy = createProxyMiddleware({
    target: `${instanceServiceUrl}${baseChildTemplatesRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
    proxyTimeout: instanceServiceRequestTimeout,
});

simbaRouter.get('/:id', simbaTemplateProxy);

simbaRouter.post('/user', simbaEntityProxy);

export default simbaRouter;
