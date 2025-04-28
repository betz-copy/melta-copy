import 'elastic-apm-node/start';
import * as mongoose from 'mongoose';
import { logger } from '@microservices/shared';
import Server from './express/server';
import config from './config';

const { mongo, service } = config;

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url);

    logger.info('Mongo connection established');
};

const main = async () => {
    await initializeMongo();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
