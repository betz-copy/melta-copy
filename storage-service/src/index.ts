/* eslint-disable no-new */
import 'elastic-apm-node/start';
import * as http from 'node:http';
import { logger } from '@packages/utils';
import menash from 'menashmq';
import { Client } from 'minio';
import config from './config';
import Server from './express/server';
import { declareTopology } from './utils/rabbit';

const { rabbit } = config;
const { url: endPoint, port, accessKey, secretKey, useSSL, transportAgent } = config.minio;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.previewQueue);

    await declareTopology();

    logger.info('Rabbit initialized');
};

const main = async () => {
    new Client({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey,
        transportAgent: new http.Agent(transportAgent),
    });
    await initializeRabbit();

    logger.info(`Storage connection established!`);

    const { port: serverPort } = config.service;
    const server = new Server(serverPort);

    await server.start();

    logger.info(`Server started on port: ${serverPort}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
