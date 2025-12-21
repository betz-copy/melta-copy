// eslint-disable-next-line import/no-extraneous-dependencies

import { logger } from '@packages/utils';
import { menash } from 'menashmq';
import config from '../../config';

const { rabbit } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.activityLogQueue);

    logger.info('Rabbit initialized');
};

export default initializeRabbit;
