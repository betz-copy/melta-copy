import { Router } from 'express';
import RuleBreachAlertsRouter from './ruleBreachAlerts/router';
import RuleBreachRequestsRouter from './ruleBreachRequests/router';
import { StatusCodes } from 'http-status-codes';

const appRouter = Router();

appRouter.use('/api/rule-breaches/alerts', RuleBreachAlertsRouter);
appRouter.use('/api/rule-breaches/requests', RuleBreachRequestsRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
