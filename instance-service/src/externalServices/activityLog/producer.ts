import { menash } from 'menashmq';
import logger from '../../utils/logger/logsLogger';
import { IActivityLog } from './interface';
import config from '../../config';

const { rabbit } = config;

export const createActivityLog = async (activityLog: Omit<IActivityLog, '_id'>) => {
    try {
        await menash.send(rabbit.activityLogQueue, activityLog);
        logger.info('Activity log created', { activityLog });
    } catch (error) {
        logger.error('Error creating activity log', { error });
    }
};
