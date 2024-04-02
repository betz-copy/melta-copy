import menash from 'menashmq';

import axios from 'axios';
import Neo4jClient from './utils/neo4j';
import RedisClient from './utils/redis';
import config from './config';
import { updateIndexConsumeFunction } from './rabbit/consumer';
import logger from './utils/logger';

const { rabbit, neo4j, redis, service } = config;

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

    await RedisClient.initialize(redis.url);

    logger.info('Redis connection established');
};

const main = async () => {
    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    await initializeRedis();
    await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);
    await initializeRabbit();
};

main();
