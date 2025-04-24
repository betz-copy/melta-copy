import 'elastic-apm-node/start';
import menash from 'menashmq';
import config from './config';
import logger from './utils/logger/logsLogger';
import { checkForDateNotifications } from './cron/dateNotificationsCheck';
import { updateKartoffelFields } from './cron/usersSyncing';

const { service, rabbit, notifications, userFieldsSync } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.notificationQueue);

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();
    if (userFieldsSync.isSyncingUsers) await updateKartoffelFields();
    if (notifications.displayCronDates) await checkForDateNotifications();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
