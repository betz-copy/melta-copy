import axios from 'axios';
import 'elastic-apm-node/start';

import { logger } from '@microservices/shared';
import menash from 'menashmq';
import config from './config';
import updateIndexConsumeFunction from './search/consumer';
import Neo4jClient from './utils/neo4j/neo4j';

const { rabbit, service } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareTopology({
        queues: [{ name: rabbit.queueName, options: { durable: true, prefetch: 1 } }],
        consumers: [{ queueName: rabbit.queueName, onMessage: updateIndexConsumeFunction }],
    });

    logger.info('Rabbit initialized');
};

const main = async () => {
    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    await Neo4jClient.initialize();
    await initializeRabbit();
};

main().catch((error) => logger.error('Main error: ', { error }));
