import { ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import { createWorkspacesController } from '../../utils/express';
import ChartController from './controller';
import ChartsValidator from './middlewares';
import {
    createChartRequestSchema,
    deleteChartRequestSchema,
    getChartByIdRequestSchema,
    getChartByTemplateIdRequestSchema,
    updateChartRequestSchema,
} from './validator.schema';

const ChartsRouter: Router = Router();

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

ChartsRouter.post(
    '/by-user/:templateId',
    ValidateRequest(getChartByTemplateIdRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    ChartsValidatorMiddleware.validateUserCanGetChartsByTemplate,
    ChartsControllerMiddleware.searchChartByUserId,
);

ChartsRouter.post(
    '/',
    ValidateRequest(createChartRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    ChartsValidatorMiddleware.validateUserCanCreateChart,
    ChartsValidatorMiddleware.validateUserCanCreateChartWithRelatedTemplate,
    ChartsControllerMiddleware.createChart,
);

ChartsRouter.delete(
    '/:chartId',
    ValidateRequest(deleteChartRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    ChartsValidatorMiddleware.validateUserCanDeleteChart,
    ChartsControllerMiddleware.deleteChart,
);

ChartsRouter.put(
    '/:chartId',
    ValidateRequest(updateChartRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    ChartsValidatorMiddleware.validateUserCanUpdateChart,
    ChartsValidatorMiddleware.validateUserCanUpdateChartWithRelatedTemplate,
    ChartsControllerMiddleware.updateChart,
);

export default ChartsRouter;
