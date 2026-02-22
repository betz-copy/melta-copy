import { Module } from '@nestjs/common';
import { MongoModelFactory, RabbitModule } from '@packages/utils';
import config from '../../config';
import { ActivityLogController } from './controllers/activityLog.controller';
import { ActivityLogConsumer } from './messaging/activityLog.consumer';
import { ActivityLogService } from './services/activityLog.service';

const {
    queues: { activityLogQueue, activityLogDelayQueue },
} = config.rabbit;

@Module({
    imports: [
        RabbitModule.register({
            url: config.rabbit.url,
            queues: {
                [activityLogQueue]: {},
                [activityLogDelayQueue]: {
                    queueOptions: {
                        deadLetterExchange: '',
                        deadLetterRoutingKey: activityLogQueue,
                    },
                },
            },
        }),
    ],
    controllers: [ActivityLogController, ActivityLogConsumer],
    providers: [ActivityLogService, MongoModelFactory],
    exports: [ActivityLogService],
})
export class ActivityLogModule {}
