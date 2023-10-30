import menash from 'menashmq';

import Neo4jClient from './utils/neo4j';
import RedisClient from './utils/redis';
import config from './config';
import { updateIndexConsumeFunction } from './rabbit/consumer';

const { rabbit, neo4j, redis } = config;

const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.uri, rabbit.retryOptions);

    console.log('Rabbit connected');

    await menash.declareTopology({
        queues: [{ name: rabbit.queueName, options: { durable: true, prefetch: 1 } }],
        consumers: [{ queueName: rabbit.queueName, onMessage: updateIndexConsumeFunction }],
    });

    console.log('Rabbit initialized');
};

const initializeRedis = async () => {
    console.log('Connecting to Redis...');

    await RedisClient.initialize(redis.url);

    console.log('Redis connection established');
};

const main = async () => {
    await initializeRedis();
    await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);
    await initializeRabbit();
};

main();
