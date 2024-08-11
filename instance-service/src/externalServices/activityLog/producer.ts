import { menash } from 'menashmq';
import logger from '../../utils/logger/logsLogger';
import { IActivityLog } from './interface';
import config from '../../config';
import { ServiceError } from '../../express/error';
import { StatusCodes } from 'http-status-codes';

const { rabbit } = config;

export const createActivityLog = async (activityLog: Omit<IActivityLog, '_id'>) => {
    try {
        await menash.send(rabbit.activityLogQueue, activityLog);
        logger.info('Activity log created', { activityLog });
    } catch (error) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error creating activity log', { error });
    }
};
