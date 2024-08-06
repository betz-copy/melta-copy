import * as apm from 'elastic-apm-node';
import menash from 'menashmq';
import { Server } from './express/server';
import { config } from './config';
import { minioClient } from './utils/minio';
import logger from './utils/logger/logsLogger';
import { ServiceError } from './express/error';

const { logs, rabbit } = config;

if (logs.enableApm) {
    apm.start({
        serviceName: logs.extraDefault.serviceName,
        serverUrl: logs.apmServerUrl,
        environment: logs.extraDefault.environment,
    });
}

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.previewQueue);

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();

    const { url: endPoint, port, accessKey, secretKey, bucketName, useSSL, transportAgent } = config.minio;
    await minioClient.initialize(endPoint, port, accessKey, secretKey, transportAgent, bucketName, useSSL);

    logger.info(`Storage connection established!`);

    const { port: serverPort } = config.service;
    const server = new Server(serverPort);

    await server.start();

    logger.info(`Server started on port: ${serverPort}`);
};

main().catch((error) => {
    process.exit(1);
    throw new ServiceError(500, 'Main error', { error });
});
