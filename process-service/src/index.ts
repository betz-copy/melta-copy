import * as mongoose from 'mongoose';
import * as apm from 'elastic-apm-node';
import Server from './express/server';
import config from './config';
import logger from './utils/logger/logsLogger';
import initializeElasticsearch from './utils/elastic/initializeElasticSearch';

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

    await mongoose.connect(mongo.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });

    logger.info('Mongo connection established');
};

const main = async () => {
    await initializeMongo();

    await initializeElasticsearch();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((err) => logger.error(err));

export default initializeMongo;
