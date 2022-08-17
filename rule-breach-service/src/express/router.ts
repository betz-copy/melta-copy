import { Router } from 'express';
import RuleBreachAlertsRouter from './ruleBreachAlerts/router';
import RuleBreachesRouter from './ruleBreaches/router';
import RuleBreachRequestsRouter from './ruleBreachRequests/router';

const appRouter = Router();

RuleBreachesRouter.use('/alerts', RuleBreachAlertsRouter);
RuleBreachesRouter.use('/requests', RuleBreachRequestsRouter);

appRouter.use('/api/rule-breaches', RuleBreachesRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
