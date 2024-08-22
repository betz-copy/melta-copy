import axios from 'axios';
import 'elastic-apm-node/start';
import menash from 'menashmq';

import config from './config';
import { updateIndexConsumeFunction } from './rabbit/consumer';
import logger from './utils/logger/logsLogger';
import Neo4jClient from './utils/neo4j/neo4j';
import RedisClient from './utils/redis';

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

const initializeRedis = async () => {
    logger.info('Connecting to Redis...');

    await RedisClient.initialize();

    logger.info('Redis connection established');
};

const main = async () => {
    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    await initializeRedis();
    await Neo4jClient.initialize();
    await initializeRabbit();
};

main();
