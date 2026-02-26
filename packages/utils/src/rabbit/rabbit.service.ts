import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ClientRMQ, RmqRecord } from '@nestjs/microservices';

@Injectable()
class RabbitService implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly queueMap: Record<string, ClientRMQ> = {};
    private readonly logger = new Logger(RabbitService.name);

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly queues: string[],
    ) {}

    onApplicationBootstrap() {
        for (const queueName of this.queues) {
            try {
                const client = this.moduleRef.get<ClientRMQ>(queueName, { strict: false });
                this.queueMap[queueName] = client;

                client.registerDisconnectListener = (amqpClient) => {
                    amqpClient.addListener('disconnect', async () => {
                        this.logger.log(`RabbitMQ disconnected from queue "${queueName}"`);
                        try {
                            await this.reconnectWithBackoff(client, queueName);
                        } catch (error) {
                            this.logger.error(`Failed to reconnect to queue "${queueName}" after max retries`, error);
                            process.exit(1);
                        }
                    });
                };
                void client.connect();
            } catch (error) {
                this.logger.error(`Failed to initialize queue "${queueName}":`, error);
            }
        }
    }

    async onApplicationShutdown() {
        this.logger.log('Shutting down RabbitService');

        await Promise.all(
            Object.entries(this.queueMap).map(async ([queueName, client]) => {
                try {
                    await client.close();
                    this.logger.log(`Closed client for queue ${queueName}`);
                } catch (err) {
                    this.logger.error(`Failed to close client for ${queueName}`, err);
                }
            }),
        );
    }

    publishMessageToQueue(queueName: string, eventName: string, payload: unknown, headers?: Record<string, string>): void {
        const client = this.queueMap[queueName];

        if (!client) throw new Error(`Queue "${queueName}" not found`);

        const message = headers ? new RmqRecord(payload, { headers }) : payload;

        client.emit(eventName, message).subscribe({
            error: (err) => this.logger.error(`Failed to publish to ${queueName}:`, err),
        });
    }

    private async reconnectWithBackoff(client: ClientRMQ, queueName: string, maxRetries = 5): Promise<void> {
        let attempt = 0;
        let delay = 1000;

        while (attempt < maxRetries) {
            try {
                await client.connect();
                this.logger.log(`Reconnected to queue "${queueName}"`);
                return;
            } catch {
                attempt++;
                this.logger.warn(`Reconnect attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`);
                await this.sleep(delay);
                delay *= 2;
            }
        }

        throw new Error(`Failed to reconnect after ${maxRetries} attempts`);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export default RabbitService;
