import { logger } from '@microservices/shared';
import { menash } from 'menashmq';
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
