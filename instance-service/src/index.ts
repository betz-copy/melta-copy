/* eslint-disable no-console */
import Server from './express/server';
import config from './config';
import Neo4jClient from './utils/neo4j';

const { service, neo4j } = config;

const main = async () => {
    const server = new Server(service.port);

    await server.start();

    await Neo4jClient.initialize(neo4j.url, neo4j.auth);

    console.log(`Server started on port: ${service.port}`);
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
