import axios from 'axios';
import 'elastic-apm-node/start';

import { logger } from '@microservices/shared';
import config from './config';
import Server from './express/server';
import Neo4jClient from './utils/neo4j';
import initializeRabbit from './utils/rabbit';

const { service } = config;

const main = async () => {
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
