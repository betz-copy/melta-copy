import menash from 'menashmq';
import axios from 'axios';
import apm from 'elastic-apm-node';
import Server from './express/server';
import config from './config';
import { checkForDateNotifications } from './utils/notifications/dateNotificationsCheck';
import logger from './utils/logger/logsLogger';

const { service, rabbit, logs } = config;

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

    await menash.declareQueue(rabbit.notificationQueue);

    await menash.declareQueue(rabbit.mailNotificationQueue);

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();

    await checkForDateNotifications();

    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
