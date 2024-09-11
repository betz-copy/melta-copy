import { StatusCodes } from 'http-status-codes';
import logger from '../../utils/logger/logsLogger';
import { IActivityLog } from './interface';
import config from '../../config';
import { DefaultExternalServiceRabbit } from '../../utils/rabbit/manager';
import { ServiceError } from '../../express/error';

const { rabbit } = config;

export class ActivityLogProducer extends DefaultExternalServiceRabbit {
    async createActivityLog(activityLog: Omit<IActivityLog, '_id'>) {
        try {
            this.sendToQueue(rabbit.activityLogQueue, activityLog);
            logger.info('Activity log created', { activityLog });
        } catch (error) {
            throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error creating activity log', { error });
        }
    }
}
