import logger from '../../utils/logger/logsLogger';
import { IActivityLog } from './interface';
import config from '../../config';
import { DefaultExternalServiceRabbit } from '../../utils/rabbit/manager';

const { rabbit } = config;

export class ActivityLogProducer extends DefaultExternalServiceRabbit {
    async createActivityLog(activityLog: Omit<IActivityLog, '_id'>) {
        try {
            this.sendToQueue(rabbit.activityLogQueue, activityLog);
            logger.info('Activity log created', { activityLog });
        } catch (error) {
            logger.error('Error creating activity log', { error });
        }
    }
}
