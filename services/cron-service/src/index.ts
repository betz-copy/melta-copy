import 'elastic-apm-node/start';
import menash from 'menashmq';
import { logger } from '@microservices/shared';
import config from './config';
import checkForDateNotifications from './cron/dateNotificationsCheck';

const { service, rabbit, notifications } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.notificationQueue);

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();
    if (notifications.displayCronDates) await checkForDateNotifications();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
