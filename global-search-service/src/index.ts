import menash from 'menashmq';
import axios from 'axios';
import config from './config';
import { updateIndexConsumeFunction } from './rabbit/consumer';
import Neo4jClient from './utils/neo4j/neo4j';
import RedisClient from './utils/redis';

const { service, rabbit } = config;

const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    console.log('Rabbit connected');

    await menash.declareTopology({
        queues: [{ name: rabbit.queueName, options: { durable: true, prefetch: 1 } }],
        consumers: [{ queueName: rabbit.queueName, onMessage: updateIndexConsumeFunction }],
    });

    console.log('Rabbit initialized');
};

const initializeRedis = async () => {
    console.log('Connecting to Redis...');

    await RedisClient.initialize();

    console.log('Redis connection established');
};

const main = async () => {
    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    await initializeRedis();
    await Neo4jClient.initialize();
    await initializeRabbit();
};

main();
