import 'elastic-apm-node/start';
import menash from 'menashmq';
import * as mongoose from 'mongoose';
import axios from 'axios';
import Server from './express/server';
import config from './config';
import logger from './utils/logger/logsLogger';

const { service, rabbit, mongo } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.notificationQueue);

    await menash.declareQueue(rabbit.mailNotificationQueue);

    await menash.declareQueue(rabbit.deleteUnusedFilesQueue);

    await menash.declareQueue(rabbit.insertDocsSemanticQueue);

    await menash.declareQueue(rabbit.deleteDocsSemanticQueue);

    logger.info('Rabbit initialized');
};

const initializeMongo = async () => {
    try {
        logger.info('Connecting to Mongo...');

        await mongoose.connect(mongo.url, mongo.connectionOptions);

        logger.info('Mongo connection established');
    } catch (err) {
        console.log({ err });
    }
};

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
