import 'elastic-apm-node/start';
import menash from 'menashmq';
import { logger } from '@microservices/shared';
import config from './config';
import checkForDateNotifications from './cron/dateNotificationsCheck';
import { updateKartoffelFields } from './cron/usersSyncing';
import runRulesWithTodayFuncCronjob from './cron/runRulesWithTodayFunc';

const { service, rabbit, notifications, userFieldsSync, rulesWithTodayFunc } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareTopology({
        queues: [
            { name: rabbit.notificationQueue },
            {
                name: rabbit.runRulesWithTodayFuncQueue,
                options: { maxLength: 1 }, // shouldnt be more than 1. only happens once at night.
            },
        ],
    });

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();
    if (userFieldsSync.isSyncingUsers) await updateKartoffelFields();
    if (notifications.displayCronDates) await checkForDateNotifications();
    if (rulesWithTodayFunc.runCron) await runRulesWithTodayFuncCronjob();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
