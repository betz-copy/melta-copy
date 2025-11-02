import { Router } from 'express';
import processesInstancesRouter from './processInstances/router';
import processesTemplatesRouter from './processTemplates/router';
import stepsInstancesRouter from './stepInstances/router';

const ProcessRouter = Router();

ProcessRouter.use('/templates', processesTemplatesRouter);
ProcessRouter.use('/instances/:processId/steps', stepsInstancesRouter);
ProcessRouter.use('/instances', processesInstancesRouter);

export default ProcessRouter;
