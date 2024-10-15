import { Client } from '@elastic/elasticsearch';
import config from '../../config';
import logger from '../logger/logsLogger';
import { IndexRequest } from '@elastic/elasticsearch/lib/api/types';

class ElasticClient {
    static client: Client | null;

    private workspaceId: string;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    static async initialize() {
        logger.info('Initializing ElasticSearch client...');

        try {
            ElasticClient.client = new Client({ node: config.elastic.url });

            logger.info('ElasticSearch client initialized successfully');
        } catch (error) {
            logger.error('Error initializing ElasticSearch client:', { error });
            throw error;
        }
    }

    index(params: Omit<IndexRequest<unknown>, 'index'>) {
        return ElasticClient.client!.index({
            index: `${config.elastic.index}-${this.workspaceId}`,
            ...params,
        });
    }
}

export default ElasticClient;
