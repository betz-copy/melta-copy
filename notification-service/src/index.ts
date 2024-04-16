import * as mongoose from 'mongoose';
import * as apm from 'elastic-apm-node';
import menash from 'menashmq';
import Server from './express/server';
import config from './config';
import NotificationsConsumer from './rabbit/consumer';
import logger from './utils/logger/logsLogger';

const { mongo, rabbit, service, logs } = config;

if (logs.enableApm) {
    apm.start({
        serviceName: logs.extraDefault.serviceName,
        serverUrl: logs.apmServerUrl,
        environment: logs.extraDefault.environment,
    });
}

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url);

    logger.info('Mongo connection established');
};

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareTopology({
        queues: [{ name: rabbit.queueName, options: { durable: true } }],
        consumers: [{ queueName: rabbit.queueName, onMessage: NotificationsConsumer.createNotification }],
    });

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((err) => logger.error(err));
