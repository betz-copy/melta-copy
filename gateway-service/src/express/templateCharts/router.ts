import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { ChartController } from './controller';
import { createWorkspacesController } from '../../utils/express';
import { ChartsValidator } from './middlewares';
import ValidateRequest from '../../utils/joi';
import { createChartRequestSchema, getChartByIdRequestSchema, getChartByTemplateIdRequestSchema, updateChartRequestSchema } from './validator.schema';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import config from '../../config';

const {
    dashboardService: { url, requestTimeout, charts },
} = config;

const ChartsServiceProxy = createProxyMiddleware({
    target: `${url}${charts.baseRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
    proxyTimeout: requestTimeout,
});

export const ChartsRouter: Router = Router();

const ChartsControllerMiddleware = createWorkspacesController(ChartController);
const ChartsValidatorMiddleware = createWorkspacesController(ChartsValidator, true);

ChartsRouter.get(
    '/:chartId',
    ValidateRequest(getChartByIdRequestSchema),
    ChartsValidatorMiddleware.validateUserCanGetChartById,
    ChartsControllerMiddleware.getChartById,
);

ChartsRouter.post(
    '/by-template/:templateId',
    ValidateRequest(getChartByTemplateIdRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    ChartsValidatorMiddleware.validateUserCanGetChartsByTemplate,
    ChartsControllerMiddleware.getChartsByTemplateId,
);

ChartsRouter.delete('/:chartId', ChartsValidatorMiddleware.validateUserCanDeleteChart, ChartsServiceProxy);

ChartsRouter.put(
    '/:chartId',
    ValidateRequest(updateChartRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    ChartsValidatorMiddleware.validateUserCanUpdateChart,
    ChartsControllerMiddleware.updateChart,
);

ChartsRouter.post(
    '/',
    ValidateRequest(createChartRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    ChartsValidatorMiddleware.validateUserCanCreateChart,
    ChartsControllerMiddleware.createChart,
);
