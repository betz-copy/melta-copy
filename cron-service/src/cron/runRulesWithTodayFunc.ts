import { logger } from '@packages/utils';
import { WorkspaceTypes } from '@packages/workspace';
import schedule from 'node-schedule';
import config from '../config';
import RabbitManager from '../utils/rabbit/rabbit';
import WorkspaceManager from '../workspaces/manager';

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
    if (runOnStart) runRulesWithTodayFunc();
    schedule.scheduleJob(cronTime, runRulesWithTodayFunc);
};

export default runRulesWithTodayFuncCronjob;
