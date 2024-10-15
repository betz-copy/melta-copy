import { Client } from '@elastic/elasticsearch';
import { IndexRequest } from '@elastic/elasticsearch/lib/api/types';
import config from '../../config';
import logger from '../logger/logsLogger';

const { elastic } = config;

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

    deleteIndex() {
        return ElasticClient.client!.indices.delete({ index: `${config.elastic.index}-${this.workspaceId}` });
    }

    async hybridSearch(query: string, embeddedQuery: number[], limit: number, skip: number, templates: string[]) {
        const filters = templates && templates.length > 0 ? { terms: { template_id: templates } } : {};

        const searchBody = {
            knn: {
                field: elastic.vectorFieldName,
                query_vector: embeddedQuery,
                k: limit,
                num_candidates: elastic.knnGroupSize,
            },
            query: {
                bool: {
                    must: {
                        multi_match: {
                            query,
                            fields: ['text'],
                            fuzziness: elastic.lexicalFuzziness,
                        },
                    },
                    filter: Object.keys(filters).length > 0 ? [filters] : [],
                },
            },
            rank: {
                rrf: {
                    rank_window_size: elastic.rrfWindowConstant,
                    rank_constant: elastic.rrfRankConstant,
                },
            },
            size: limit,
        };

        const indexName = `${elastic.index}-${this.workspaceId}`;

        const response = await ElasticClient.client!.search({
            index: indexName,
            from: skip,
            size: limit,
            query: searchBody.query,
            knn: searchBody.knn,
            rank: searchBody.rank,
        });

        return response.hits.hits;
    }
}

export default ElasticClient;
