import { logger } from '@packages/utils';
import { menash } from 'menashmq';
import config from '../../config';
import ActivityLogConsumer from '../../rabbit/consumer';

const { rabbit } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareTopology({
        queues: [{ name: rabbit.queueName, options: { durable: true } }],
        consumers: [{ queueName: rabbit.queueName, onMessage: ActivityLogConsumer.createActivityLog }],
    });

    logger.info('Rabbit initialized');
};

export default initializeRabbit;
