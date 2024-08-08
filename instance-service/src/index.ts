import axios from 'axios';
import apm from 'elastic-apm-node';
import config from './config';
import Server from './express/server';
import logger from './utils/logger/logsLogger';
import Neo4jClient from './utils/neo4j';
import initializeRabbit from './utils/rabbit';
import RedisClient from './utils/redis';

const { service, logs } = config;

if (logs.enableApm) {
    apm.start({
        serviceName: logs.extraDefault.serviceName,
        serverUrl: logs.apmServerUrl,
        environment: logs.extraDefault.environment,
    });
}

const initializeRedis = async () => {
    logger.info('Connecting to Redis...');

    await RedisClient.initialize();

    logger.info('Redis connection established');
};

const main = async () => {
    await initializeRedis();
    await initializeRabbit();
    await Neo4jClient.initialize();

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
