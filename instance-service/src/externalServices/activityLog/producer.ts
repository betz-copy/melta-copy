import { IActivityLog } from '@microservices/shared';
import config from '../../config';
import DefaultExternalServiceRabbit from '../../utils/rabbit/manager';
import { ServiceError } from '../../express/error';

const { rabbit } = config;

class ActivityLogProducer extends DefaultExternalServiceRabbit {
    async createActivityLog(activityLog: Omit<IActivityLog, '_id'>) {
        try {
            this.sendToQueue(rabbit.activityLogQueue, activityLog);
        } catch (error) {
            throw new ServiceError(undefined, 'Error creating activity log', { error });
        }
    }
}

export default ActivityLogProducer;
