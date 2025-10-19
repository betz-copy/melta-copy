// eslint-disable-next-line import/no-extraneous-dependencies
import { menash } from 'menashmq';

import { logger } from '@microservices/shared';
import config from '../../config';

const { rabbit } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareTopology({ queues: [{ name: rabbit.activityLogQueue }, { name: rabbit.createAlertForRuleWithTodayFuncQueue }] });

    logger.info('Rabbit initialized');
};

export default initializeRabbit;
