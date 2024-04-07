import * as mongoose from 'mongoose';
import menash from 'menashmq';
import Server from './express/server';
import config from './config';
import logger from './utils/logger/logsLogger';

const { mongo, service, rabbit } = config;

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

    logger.info('Mongo connection established');
};

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.updateSearchIndexQueueName);

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
