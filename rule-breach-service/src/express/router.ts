import { Router } from 'express';
import RuleBreachAlertsRouter from './ruleBreachAlert/router';
import RuleBreachesRouter from './ruleBreaches/router';

const appRouter = Router();

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
