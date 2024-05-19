import * as mongoose from 'mongoose';
import * as apm from 'elastic-apm-node';
import Server from './express/server';
import config from './config';
import logger from './utils/logger/logsLogger';
import ElasticClient from './utils/elastic/index';

const { mongo, service, logs, elasticClient } = config;

if (logs.enableApm) {
    apm.start({
        serviceName: logs.extraDefault.serviceName,
        serverUrl: logs.apmServerUrl,
        environment: logs.extraDefault.environment,
    });
}

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });

    logger.info('Mongo connection established');
};

const createProcessSearchIndex = async () => {
    try {
        const client = ElasticClient.getClient();
        const isIndexExists = await client.indices.exists({ index: elasticClient.index });
        if (!isIndexExists) await client.indices.create({ index: elasticClient.index });
    } catch (error) {
        logger.error('Error checking or creating index:', error);
    }
};

const initializeElasticsearch = async () => {
    logger.info('Connecting to elastic...');

    await ElasticClient.initialize(elasticClient.url);

    await createProcessSearchIndex();

    logger.info('elastic connection established');
};

const main = async () => {
    await initializeElasticsearch();

    await initializeMongo();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((err) => logger.error(err));
