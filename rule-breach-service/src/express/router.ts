import { Router } from 'express';
import RuleBreachAlertsRouter from './ruleBreachAlerts/router';
import RuleBreachRequestsRouter from './ruleBreachRequests/router';

const appRouter = Router();

appRouter.use('/api/rule-breaches/alerts', RuleBreachAlertsRouter);
appRouter.use('/api/rule-breaches/requests', RuleBreachRequestsRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
