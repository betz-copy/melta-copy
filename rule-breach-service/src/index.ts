import 'elastic-apm-node/start';
import * as mongoose from 'mongoose';
import Server from './express/server';
import config from './config';
import logger from './utils/logger/logsLogger';
import { ServiceError } from './express/error';
import { StatusCodes } from 'http-status-codes';

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

main().catch((error) => {
    throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Main error', { error });
});
