import * as apm from 'elastic-apm-node';
import menash from 'menashmq';
import { config } from './config';
import { Server } from './express/server';
import logger from './utils/logger/logsLogger';

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

    logger.info(`Storage connection established!`);

    const { port: serverPort } = config.service;
    const server = new Server(serverPort);

    await server.start();

    logger.info(`Server started on port: ${serverPort}`);
};

main().catch((error) => {
    logger.error('Main error: ', { error });
    process.exit(1);
});
