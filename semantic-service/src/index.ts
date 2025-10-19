import 'elastic-apm-node/start';
import menash from 'menashmq';
import { logger } from '@microservices/shared';
import Server from './express/server';
import config from './config';
import SemanticConsumer from './rabbit/consumer';
import ElasticClient from './utils/elastic';

const { rabbit, service } = config;

const initializeElasticsearch = async () => {
    logger.info('Connecting to elastic...');

    await ElasticClient.initialize();

    logger.info('elastic connection established');
};

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareTopology({
        queues: [
            { name: rabbit.insertQueue, options: { durable: true } },
            { name: rabbit.deleteQueue, options: { durable: true } },
        ],
        consumers: [
            { queueName: rabbit.insertQueue, onMessage: SemanticConsumer.indexFiles },
            { queueName: rabbit.deleteQueue, onMessage: SemanticConsumer.deleteFiles },
        ],
    });

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeElasticsearch();

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => {
    logger.error('Main error: ', { error });
});
