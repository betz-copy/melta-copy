import 'elastic-apm-node/start';
import * as mongoose from 'mongoose';
import { logger } from '@microservices/shared';
import config from './config';
import Server from './express/server';
import ElasticClient from './utils/elastic';
import initializeRabbit from './utils/rabbit';

const { mongo, service } = config;

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url, mongo.connectionOptions);

    logger.info('Mongo connection established');
};

const initializeElasticsearch = async () => {
    logger.info('Connecting to elastic...');

    await ElasticClient.initialize();

    logger.info('elastic connection established');
};

const main = async () => {
    await initializeRabbit();

    await initializeMongo();

    await initializeElasticsearch();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
