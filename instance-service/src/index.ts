import 'elastic-apm-node/start';
import axios from 'axios';

import Server from './express/server';
import Neo4jClient from './utils/neo4j';
import RedisClient from './utils/redis';
import config from './config';
import logger from './utils/logger/logsLogger';
import initializeRabbit from './utils/rabbit';

const { service, neo4j, redis } = config;


const initializeRedis = async () => {
    logger.info('Connecting to Redis...');

    await RedisClient.initialize(redis.url);

    logger.info('Redis connection established');
};

const main = async () => {
    await initializeRedis();
    await initializeRabbit();
    await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);

    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => {
    logger.error('Main error: ', { error });
    process.exit(1);
});

process
    .on('unhandledRejection', (reason, p) => {
        logger.error('Unhandled Rejection at Promise', { error: { p, reason } });
        process.exit(1);
    })
    .on('uncaughtException', (error) => {
        logger.error('Uncaught Exception thrown', { error });
        process.exit(1);
    });
