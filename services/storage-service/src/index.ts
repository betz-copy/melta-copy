import 'elastic-apm-node/start';
import menash from 'menashmq';
import { config } from './config';
import { Server } from './express/server';
import { logger } from '@microservices/shared';
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

main().catch((error) => logger.error('Main error: ', { error }));
