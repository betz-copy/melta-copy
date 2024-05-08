import * as mongoose from 'mongoose';
import * as apm from 'elastic-apm-node';
import Server from './express/server';
import config from './config';
import logger from './utils/logger/logsLogger';
import ElasticClient from './utils/elastic/index';

const { mongo, service, logs } = config;

if (logs.enableApm) {
    apm.start({
        serviceName: logs.extraDefault.serviceName,
        serverUrl: logs.apmServerUrl,
        environment: logs.extraDefault.environment,
    });
}

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

    logger.info('Mongo connection established');
};

const initializeElasticsearch = async () => {
    logger.info('Connecting to elastic...');

    await ElasticClient.initialize('http://elastic:9200');

    logger.info('elastic connection established');
};

const createIndex = async () => {
    const client = ElasticClient.getClient();
    console.log('get client ', { client });
    try {
        const isIndexExist = await client.indices.exists({ index: 'process-search' });
        console.log({ isIndexExist });

        if (!isIndexExist) await client.indices.create({ index: 'process-search' });
        else console.log('Index already exists');
    } catch (error) {
        console.error('Error checking or creating index:', error);
    }
};

const main = async () => {
    console.log('*******************************');
    await initializeElasticsearch();
    console.log('###############################');
    await initializeMongo();
    await createIndex();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((err) => logger.error(err));
