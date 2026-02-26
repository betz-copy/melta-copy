import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ActivityLogSchema, IActivityLog } from '@packages/activity-log';
import { ClsService, zodBasicValidateRequest } from '@packages/utils';
import * as amqp from 'amqplib';
import config from '../../../config';
import { ActivityLogService } from '../services/activityLog.service';

const {
    server: { workspaceIdHeader, retryCountHeader },
    rabbit: {
        queueRetryOptions,
        queues: { activityLogQueue, activityLogDelayQueue },
    },
} = config;

@Controller()
export class ActivityLogConsumer {
    private readonly logger = new Logger(ActivityLogConsumer.name);

    constructor(
        protected readonly cls: ClsService,
        private readonly activityLogService: ActivityLogService,
    ) {}

    @EventPattern(activityLogQueue)
    async handle(@Payload() data: unknown, @Ctx() ctx: RmqContext) {
        const channel = ctx.getChannelRef() as amqp.Channel | amqp.ConfirmChannel;
        const msg = ctx.getMessage() as amqp.Message;

        const headers = msg?.properties?.headers ?? {};
        const retryCount = Number(headers[retryCountHeader] ?? 0);
        const workspaceId = headers[workspaceIdHeader] as string;

        await this.cls.run(async () => {
            this.cls.set(workspaceIdHeader, workspaceId);

            try {
                const value: IActivityLog = zodBasicValidateRequest(ActivityLogSchema, data);

                await this.activityLogService.createActivity(value);

                channel.ack(msg);
                this.logger.log(`Activity logged for workspace ${workspaceId}`);
            } catch (err) {
                if (retryCount < queueRetryOptions.maxRetries) {
                    const delay = 2 ** retryCount * queueRetryOptions.queueRetryDelay;

                    this.logger.warn(`Retrying message, attempt ${retryCount + 1}/${queueRetryOptions.maxRetries} after ${delay}ms`);

                    channel.sendToQueue(activityLogDelayQueue, msg.content, {
                        ...msg.properties,
                        headers: {
                            ...headers,
                            [retryCountHeader]: retryCount + 1,
                        },
                        expiration: delay.toString(),
                    });

                    channel.ack(msg);
                } else {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    this.logger.error(`Rabbit consumer error: ${errorMessage}`, err);
                    channel.nack(msg, false, false);
                }
            }
        });
    }
}
