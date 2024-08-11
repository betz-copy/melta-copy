import axios from 'axios';
import apm from 'elastic-apm-node';

import Server from './express/server';
import Neo4jClient from './utils/neo4j';
import RedisClient from './utils/redis';
import config from './config';
import logger from './utils/logger/logsLogger';
import initializeRabbit from './utils/rabbit';
import { ServiceError } from './express/error';
import { StatusCodes } from 'http-status-codes';

const { service, neo4j, redis, logs } = config;

if (logs.enableApm) {
    apm.start({
        serviceName: logs.extraDefault.serviceName,
        serverUrl: logs.apmServerUrl,
        environment: logs.extraDefault.environment,
    });
}

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
    process.exit(1);
    throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Main error', { error });
});

process
    .on('unhandledRejection', (reason, p) => {
        process.exit(1);
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Unhandled Rejection at Promise', { error: { p, reason } });
    })
    .on('uncaughtException', (error) => {
        process.exit(1);
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Uncaught Exception thrown', { error });
    });
