import { Client } from '@elastic/elasticsearch';
import type { DeleteRequest, ExistsRequest, IndexRequest, SearchRequest, UpdateRequest } from '@elastic/elasticsearch/lib/api/types';
import { logger } from '@microservices/shared';
import config from '../../config';

const {
    elastic: { index, url, user, password, tlsRejectUnauthorized },
} = config;
class ElasticClient {
    static client: Client | null;

    private workspaceId: string;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    static async initialize() {
        logger.info('Initializing ElasticSearch client...');

        try {
            ElasticClient.client = new Client({
                node: url,
                auth: { username: user, password },
                tls: {
                    rejectUnauthorized: tlsRejectUnauthorized,
                },
            });

            logger.info('ElasticSearch client initialized successfully');
        } catch (error) {
            logger.error('Error initializing ElasticSearch client:', { error });
            throw error;
        }
    }

    index(params: Omit<IndexRequest<unknown>, 'index'>) {
        return ElasticClient.client!.index({
            index: `${index}-${this.workspaceId}`,
            ...params,
        });
    }

    exists(params: Omit<ExistsRequest, 'index'>) {
        return ElasticClient.client!.exists({
            index: `${index}-${this.workspaceId}`,
            ...params,
        });
    }

    update(params: Omit<UpdateRequest<unknown, unknown>, 'index'>) {
        return ElasticClient.client!.update({
            index: `${index}-${this.workspaceId}`,
            ...params,
        });
    }

    delete(params: Omit<DeleteRequest, 'index'>) {
        return ElasticClient.client!.delete({
            index: `${index}-${this.workspaceId}`,
            ...params,
        });
    }

    search(params: Omit<SearchRequest, 'index'>) {
        return ElasticClient.client!.search({
            index: `${index}-${this.workspaceId}`,
            ...params,
        });
    }
}

export default ElasticClient;
