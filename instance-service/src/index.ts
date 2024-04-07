import axios from 'axios';
import Server from './express/server';
import Neo4jClient from './utils/neo4j';
import RedisClient from './utils/redis';
import config from './config';
import logger from './utils/logger/logsLogger';

const { service, neo4j, redis } = config;

const initializeRedis = async () => {
    logger.info('Connecting to Redis...');

    await RedisClient.initialize(redis.url);

    logger.info('Redis connection established');
};

const main = async () => {
    await initializeRedis();
    await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);

    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((err) => {
    logger.error(err);
    process.exit(1);
});

process
    .on('unhandledRejection', (reason, p) => {
        logger.error('Unhandled Rejection at Promise', p, reason);
        process.exit(1);
    })
    .on('uncaughtException', (err) => {
        logger.error('Uncaught Exception thrown', err);
        process.exit(1);
    });
