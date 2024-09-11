import 'elastic-apm-node/start';
import mongoose from 'mongoose';
import axios from 'axios';
import menash from 'menashmq';
import Server from './express/server';
import config from './config';
import logger from './utils/logger/logsLogger';
import { ServiceError } from './express/error';
import { StatusCodes } from 'http-status-codes';

const { mongo, service, rabbit } = config;


const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url);

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

    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => {
    throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Main error', { error });
});
