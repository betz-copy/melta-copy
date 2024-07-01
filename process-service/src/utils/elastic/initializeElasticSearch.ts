import ElasticClient from '.';
import config from '../../config';
import logger from '../logger/logsLogger';

const { elasticClient } = config;

const createProcessSearchIndex = async (clientInstance: ElasticClient) => {
    try {
        const client = clientInstance.getClient();
        const isIndexExists = await client.indices.exists({ index: elasticClient.index });
        if (!isIndexExists) await client.indices.create({ index: elasticClient.index });
    } catch (error) {
        logger.error('Error checking or creating index:', error);
    }
};

const initializeElasticsearch = async () => {
    logger.info('Connecting to elastic...');
    const clientInstance: ElasticClient = ElasticClient.getInstance();

    await clientInstance.initialize(elasticClient.url);

    await createProcessSearchIndex(clientInstance);

    logger.info('elastic connection established');
};

export default initializeElasticsearch;
