import axios from 'axios';
import 'elastic-apm-node/start';

import { StatusCodes } from 'http-status-codes';
import config from './config';
import Server from './express/server';
import logger from './utils/logger/logsLogger';
import Neo4jClient from './utils/neo4j';
import initializeRabbit from './utils/rabbit';
import { ServiceError } from './express/error';

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
