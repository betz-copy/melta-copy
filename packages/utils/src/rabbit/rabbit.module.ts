import { DynamicModule, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ClientsModule, RmqOptions, Transport } from '@nestjs/microservices';
import { Options } from 'amqplib';
import config from '../config';
import RabbitService from './rabbit.service';

export type QueueOptions = Partial<RmqOptions['options']>;

const defaultQueueOptions: Options.AssertQueue = {
    durable: true,
};

@Module({})
class RabbitModule {
    static forQueues(queues: Record<string, QueueOptions>): DynamicModule {
        const queueNames = Object.keys(queues);

        return {
            module: RabbitModule,
            imports: [
                ClientsModule.registerAsync({
                    clients: Object.entries(queues).map(([queueName, options]) => ({
                        name: queueName,
                        useFactory: () =>
                            ({
                                transport: Transport.RMQ,
                                options: {
                                    urls: [config.rabbit.url],
                                    queue: queueName,
                                    ...options,
                                    queueOptions: {
                                        ...defaultQueueOptions,
                                        ...options?.queueOptions,
                                    },
                                },
                            }) as RmqOptions,
                    })),
                }),
            ],
            providers: [
                {
                    provide: RabbitService,
                    useFactory: (moduleRef) => new RabbitService(moduleRef, queueNames),
                    inject: [ModuleRef],
                },
            ],
            exports: [RabbitService],
        };
    }
}

export default RabbitModule;
