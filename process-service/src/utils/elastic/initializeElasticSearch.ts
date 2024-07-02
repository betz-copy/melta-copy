import ElasticClient from '.';
import config from '../../config';
import logger from '../logger/logsLogger';

const { elastic } = config;

const createProcessSearchIndex = async (clientInstance: ElasticClient, index: string) => {
    try {
        const client = clientInstance.getClient();
        const isIndexExists = await client.indices.exists({ index });
        if (!isIndexExists) await client.indices.create({ index });
    } catch (error) {
        logger.error('Error checking or creating index:', { error });
    }
};

const initializeElasticsearch = async () => {
    logger.info('Connecting to elastic...');
    const clientInstance: ElasticClient = ElasticClient.getInstance();

    await clientInstance.initialize(elastic.url);

    await createProcessSearchIndex(clientInstance, elastic.index);

    logger.info('elastic connection established');
};

export default initializeElasticsearch;
