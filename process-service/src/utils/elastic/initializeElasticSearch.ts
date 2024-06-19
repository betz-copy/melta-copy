import config from '../../config';
import logger from '../logger/logsLogger';
import ElasticClient from './index';

const { elasticClient } = config;

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

export default initializeElasticsearch;
