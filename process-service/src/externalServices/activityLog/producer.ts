/* eslint-disable import/prefer-default-export */
import { ServiceError } from '@microservices/shared';
import { IActivityLog } from './interface';
import config from '../../config';
import { DefaultExternalServiceRabbit } from '../../utils/rabbit/manager';

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
