import { Router } from 'express';
import IFramesController from './controller';
import { validateUserHasAtLeastSomePermissions } from '../permissions/validateAuthorizationMiddleware';
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
import { validateUserCanDeleteIFrame, validateUserCanUpdateIFrame } from './middlewares';

const iFramesRouter: Router = Router();

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
    wrapController(IFramesController.getIFrameById),
);
iFramesRouter.get('/externalSite/:iFrameId', ValidateRequest(getExternalSiteByIdSchema), wrapController(IFramesController.getExternalSiteById));
// iFramesRouter.get('/', wrapController(IFramesController.getAllIFrames));
iFramesRouter.post(
    '/',
    ValidateRequest(createIFrameSchema),
    // wrapMiddleware(validateUserCanCreateIFrame),
    wrapController(IFramesController.createIFrame),
);
iFramesRouter.delete(
    '/:iFrameId',
    ValidateRequest(deleteIFrameSchema),
    wrapMiddleware(validateUserCanDeleteIFrame),
    wrapController(IFramesController.deleteIFrame),
);
iFramesRouter.put(
    '/:iFrameId',
    ValidateRequest(updateIFrameSchema),
    wrapMiddleware(validateUserCanUpdateIFrame),
    wrapController(IFramesController.updateIFrame),
);
iFramesRouter.post(
    '/search',
    ValidateRequest(searchIFramesSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(IFramesController.searchIFrames),
);

export default iFramesRouter;
