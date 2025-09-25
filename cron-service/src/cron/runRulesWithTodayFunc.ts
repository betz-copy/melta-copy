import schedule from 'node-schedule';
import { logger, WorkspaceTypes } from '@microservices/shared';
import config from '../config';
import WorkspaceManager from '../workspaces/manager';
import RabbitManager from '../utils/rabbit/rabbit';

const {
    rulesWithTodayFunc: { cronTime, runOnStart },
} = config;

const runRulesWithTodayFunc = async () => {
    logger.info('Running rules with getToday() function...');
    const workspaceIds = await WorkspaceManager.getWorkspaceIds(WorkspaceTypes.mlt);

    await Promise.all(
        workspaceIds.map(async (workspaceId) => {
            try {
                const rabbitManager = new RabbitManager(workspaceId);
                await rabbitManager.runRulesWithTodayFuncQueue();
            } catch (error) {
                logger.error('Error sending to rabbit run rules with today function:', { error, workspaceId });
            }
        }),
    );
};

const runRulesWithTodayFuncCronjob = async () => {
    if (runOnStart) await runRulesWithTodayFunc();
    schedule.scheduleJob(cronTime, runRulesWithTodayFunc);
};

export default runRulesWithTodayFuncCronjob;
