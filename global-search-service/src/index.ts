import menash, { ConsumerMessage } from 'menashmq';

import { trycatch } from './utils';
import fetchTemplatesAndCreateIndex from './search';
import Neo4jClient from './utils/neo4j/index';
import RedisClient from './utils/redis';
import config from './config';

const { rabbit, neo4j, redis } = config;

const searchConsumeFunction = async (msg: ConsumerMessage) => {
    const { err } = await trycatch(() => fetchTemplatesAndCreateIndex());

    if (err) {
        msg.nack(false);

        throw new Error(`Failed to create new search index: ${err}`);
    }

    console.log(`Successfully created new search index!`);
    msg.ack();
};

const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.uri, rabbit.retryOptions);

    console.log('Rabbit connected');

    await menash.declareTopology({
        queues: [{ name: rabbit.queueName, options: { durable: true } }],
        consumers: [{ queueName: rabbit.queueName, onMessage: searchConsumeFunction }],
    });

    console.log('Rabbit initialized');
};

const initializeRedis = async () => {
    console.log('Connecting to Redis...');

    await RedisClient.initialize(redis.url);

    console.log('Redis connection established');
};

const main = async () => {
    await initializeRabbit();
    await initializeRedis();
    await Neo4jClient.initialize(neo4j.url, neo4j.auth);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p);
        process.exit(1);
    })
    .on('uncaughtException', (err) => {
        console.error(err, 'Uncaught Exception thrown');
        process.exit(1);
    });
