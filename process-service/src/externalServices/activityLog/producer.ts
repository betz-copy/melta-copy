import { ServiceError } from '@microservices/shared';
import config from '../../config';
import { DefaultExternalServiceRabbit } from '../../utils/rabbit/manager';
import { IActivityLog } from './interface';

const { rabbit } = config;

export class ActivityLogProducer extends DefaultExternalServiceRabbit {
    async createActivityLog(activityLog: Omit<IActivityLog, '_id'>) {
        try {
            this.sendToQueue(rabbit.activityLogQueue, activityLog);
        } catch (error) {
            throw new ServiceError(undefined, 'Error creating activity log', { error });
        }
    }
}
