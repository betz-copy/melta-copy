import { Router } from 'express';
import IFramesController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createIFrameSchema, deleteIFrameSchema, getIFrameByIdSchema, searchIFramesSchema, updateIFrameSchema } from './validator.schema';

const iFramesRouter: Router = Router();

// const grafanaUrl = 'https://play.grafana.org/d/000000012/grafana-play-home?orgId=1';
// const testUrl =
//     'https://devtankhq-public.opensmartmonitor.devtank.co.uk/d/QrMxJyO4k/office-environment?orgId=1&refresh=15m&from=now-24h&to=now&kiosk=tv?blueprint=undefined&';
// // const apiToken = 'your_grafana_api_token';
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

// iFramesRouter.get('/externalSite/:iFrameId', ValidateRequest(getExternalSiteByIdSchema), IFramesManagerProxy);
iFramesRouter.get('/:iFrameId', ValidateRequest(getIFrameByIdSchema), wrapController(IFramesController.getIFrameById));
iFramesRouter.get('/', wrapController(IFramesController.getAllIFrames));
iFramesRouter.post('/', ValidateRequest(createIFrameSchema), wrapController(IFramesController.createIFrame));
iFramesRouter.delete('/:iFrameId', ValidateRequest(deleteIFrameSchema), wrapController(IFramesController.deleteIFrame));
iFramesRouter.put('/:iFrameId', ValidateRequest(updateIFrameSchema), wrapController(IFramesController.updateIFrame));
iFramesRouter.post('/search', ValidateRequest(searchIFramesSchema), wrapController(IFramesController.searchIFrames));

export default iFramesRouter;
