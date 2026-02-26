import { DynamicModule, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ClientsModule, RmqOptions, Transport } from '@nestjs/microservices';
import { Options } from 'amqplib';
import RabbitService from './rabbit.service';

export type QueueOptions = Partial<RmqOptions['options']>;

const defaultQueueOptions: Options.AssertQueue = {
    durable: true,
};

type RabbitModuleOptions = {
    url: string;
    queues: Record<string, QueueOptions>;
};

@Module({})
class RabbitModule {
    static register(options: RabbitModuleOptions): DynamicModule {
        const queueNames = Object.keys(options.queues);

        return {
            module: RabbitModule,
            imports: [
                ClientsModule.registerAsync({
                    clients: Object.entries(options.queues).map(([queueName, queueOptions]) => ({
                        name: queueName,
                        useFactory: () =>
                            ({
                                transport: Transport.RMQ,
                                options: {
                                    urls: [options.url],
                                    queue: queueName,
                                    ...queueOptions,
                                    queueOptions: {
                                        ...defaultQueueOptions,
                                        ...queueOptions?.queueOptions,
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
