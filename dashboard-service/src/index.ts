import { logger } from '@microservices/shared';
import axios from 'axios';
import 'elastic-apm-node/start';
import mongoose from 'mongoose';
import config from './config';
import Server from './express/server';

const { mongo, service } = config;

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url, mongo.connectionOptions);

    logger.info('Mongo connection established');
};

const main = async () => {
    await initializeMongo();

    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
