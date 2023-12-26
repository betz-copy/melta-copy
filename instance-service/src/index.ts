import Server from './express/server';
import Neo4jClient from './utils/neo4j';
import RedisClient from './utils/redis';
import config from './config';

const { service, neo4j, redis } = config;

const initializeRedis = async () => {
    console.log('Connecting to Redis...');

    await RedisClient.initialize(redis.url);

    console.log('Redis connection established');
};

const main = async () => {
    await initializeRedis();
    await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);

    const server = new Server(service.port);

    await server.start();

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
