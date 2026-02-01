import 'elastic-apm-node/start';
import { logger } from '@microservices/shared';
import menash from 'menashmq';
import config from './config';
import checkForDateNotifications from './cron/dateNotificationsCheck';
import runRulesWithTodayFuncCronjob from './cron/runRulesWithTodayFunc';
import { updateKartoffelFields } from './cron/usersSyncing';

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
            },
        ],
    });

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();
    if (userFieldsSync.isSyncingUsers) await updateKartoffelFields(); //TODO: check if remove
    if (notifications.displayCronDates) await checkForDateNotifications();
    if (rulesWithTodayFunc.runCron) await runRulesWithTodayFuncCronjob();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
