import { Router } from 'express';
import IFramesController from './controller';
import { validateUserHasAtLeastSomePermissions, validateUserIsTemplatesManager } from '../permissions/validateAuthorizationMiddleware';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createIFrameSchema,
    deleteIFrameSchema,
    getExternalSiteByIdSchema,
    getIFrameByIdSchema,
    searchIFramesSchema,
    updateIFrameSchema,
} from './validator.schema';
import { validateUserCanCreateIFrame, validateUserCanDeleteIFrame, validateUserCanGetIFrame, validateUserCanUpdateIFrame } from './middlewares';

export const iFramesRouter: Router = Router();

// const testUrl =
//     'https://devtankhq-public.opensmartmonitor.devtank.co.uk/d/QrMxJyO4k/office-environment?orgId=1&refresh=15m&from=now-24h&to=now&kiosk=tv?blueprint=undefined&';

// const IFramesManagerProxy = createProxyMiddleware({
//     target: testUrl,
//     changeOrigin: true,
//     // onProxyReq: (proxyReq, req, res) => {
//     //     fixRequestBody(proxyReq, req);
//     //     proxyReq.setHeader('Authorization', `Bearer ${apiToken}`);
//     //     proxyReq.setHeader('Content-Type', 'application/json');
//     // },
//     proxyTimeout: 1000,
// });

iFramesRouter.get(
    '/:iFrameId',
    ValidateRequest(getIFrameByIdSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapMiddleware(validateUserCanGetIFrame),
    wrapController(IFramesController.getIFrameById),
);

iFramesRouter.get(
    '/externalSite/:iFrameId',
    ValidateRequest(getExternalSiteByIdSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapMiddleware(validateUserCanGetIFrame),
    wrapController(IFramesController.getExternalSiteById),
);

iFramesRouter.post(
    '/',
    ValidateRequest(createIFrameSchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapMiddleware(validateUserCanCreateIFrame),
    wrapController(IFramesController.createIFrame),
);

iFramesRouter.put(
    '/:iFrameId',
    ValidateRequest(updateIFrameSchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapMiddleware(validateUserCanUpdateIFrame),
    wrapController(IFramesController.updateIFrame),
);
iFramesRouter.delete(
    '/:iFrameId',
    ValidateRequest(deleteIFrameSchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapMiddleware(validateUserCanDeleteIFrame),
    wrapController(IFramesController.deleteIFrame),
);

iFramesRouter.post(
    '/search',
    ValidateRequest(searchIFramesSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(IFramesController.searchIFrames),
);

export default iFramesRouter;
