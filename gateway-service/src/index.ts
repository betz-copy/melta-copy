import 'elastic-apm-node/start';
import { logger } from '@microservices/shared';
import axios from 'axios';
import menash from 'menashmq';
import config from './config';
import Server from './express/server';
import { createRuleBreachAlertQueue, runRulesWithTodayFunc } from './express/templates/rules/runRulesWithTodayFuncConsumer';

const { service, rabbit } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareTopology({
        queues: [
            { name: rabbit.notificationQueue },
            { name: rabbit.mailNotificationQueue },
            { name: rabbit.deleteUnusedFilesQueue },
            { name: rabbit.insertDocsSemanticQueue },
            { name: rabbit.deleteDocsSemanticQueue },
            { name: rabbit.runRulesWithTodayFuncQueue, options: { prefetch: rabbit.runRulesWithTodayFuncQueuePrefetch } },
            { name: rabbit.createAlertForRuleWithTodayFuncQueue },
        ],
        consumers: [
            { queueName: rabbit.runRulesWithTodayFuncQueue, onMessage: runRulesWithTodayFunc },
            { queueName: rabbit.createAlertForRuleWithTodayFuncQueue, onMessage: createRuleBreachAlertQueue },
        ],
    });

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();

    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));
