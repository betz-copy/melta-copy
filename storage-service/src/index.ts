import 'elastic-apm-node/start';
import menash from 'menashmq';
import { StatusCodes } from 'http-status-codes';
import { config } from './config';
import { Server } from './express/server';
import logger from './utils/logger/logsLogger';
import { ServiceError } from './express/error';
import { declareTopology } from './utils/rabbit';

const { rabbit } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.previewQueue);

    await declareTopology();

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();

    logger.info(`Storage connection established!`);

    const { port: serverPort } = config.service;
    const server = new Server(serverPort);

    await server.start();

    logger.info(`Server started on port: ${serverPort}`);
};

main().catch((error) => {
    process.exit(1);
    throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Main error', { error });
});
