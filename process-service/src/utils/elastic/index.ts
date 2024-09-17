import { Client } from '@elastic/elasticsearch';
import type { DeleteRequest, ExistsRequest, IndexRequest, SearchRequest, UpdateRequest } from '@elastic/elasticsearch/lib/api/types';
import config from '../../config';
import logger from '../logger/logsLogger';

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

    exists(params: Omit<ExistsRequest, 'index'>) {
        return ElasticClient.client!.exists({
            index: `${config.elastic.index}-${this.workspaceId}`,
            ...params,
        });
    }

    update(params: Omit<UpdateRequest<unknown, unknown>, 'index'>) {
        return ElasticClient.client!.update({
            index: `${config.elastic.index}-${this.workspaceId}`,
            ...params,
        });
    }

    delete(params: Omit<DeleteRequest, 'index'>) {
        return ElasticClient.client!.delete({
            index: `${config.elastic.index}-${this.workspaceId}`,
            ...params,
        });
    }

    search(params: Omit<SearchRequest, 'index'>) {
        return ElasticClient.client!.search({
            index: `${config.elastic.index}-${this.workspaceId}`,
            ...params,
        });
    }
}

export default ElasticClient;
