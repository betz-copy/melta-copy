import 'elastic-apm-node/start';
import { logger } from '@packages/utils';
import * as mongoose from 'mongoose';
import config from './config';
import Server from './express/server';
import initializeRabbit from './utils/rabbit';

const { mongo, service } = config;

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url, mongo.connectionOptions);

    logger.info('Mongo connection established');
};

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
