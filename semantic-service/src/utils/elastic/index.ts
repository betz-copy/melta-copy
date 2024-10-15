import { Client } from '@elastic/elasticsearch';
import config from '../../config';
import { Chunk } from '../../express/semantics/interface';
import logger from '../logger/logsLogger';

const {
    elastic: { index, url, vectorDims, similarityAlgorithm, knnGroupSize, lexicalFuzziness, rrfWindowConstant, rrfRankConstant },
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
            ElasticClient.client = new Client({ node: url });

            logger.info('ElasticSearch client initialized successfully');
        } catch (error) {
            logger.error('Error initializing ElasticSearch client:', { error });
            throw error;
        }
    }

    createIndex() {
        return ElasticClient.client!.indices.create({
            index: `${index}-${this.workspaceId}`,
            mappings: {
                properties: {
                    embedding: {
                        type: 'dense_vector',
                        dims: vectorDims,
                        index: true,
                        similarity: similarityAlgorithm,
                    },
                    text: { type: 'text' },
                    title: { type: 'text' },
                    workspace_id: { type: 'text' },
                    template_id: { type: 'text' },
                    entity_id: { type: 'text' },
                    minio_file_id: { type: 'text' },
                },
            },
        });
    }

    deleteIndex() {
        return ElasticClient.client!.indices.delete({ index: `${config.elastic.index}-${this.workspaceId}` });
    }

    async hybridSearch(query: string, embeddedQuery: number[], limit: number, skip: number, templates: string[]) {
        const filters = templates && templates.length > 0 ? { terms: { template_id: templates } } : {};

        const searchBody = {
            knn: {
                field: 'embedding',
                query_vector: embeddedQuery,
                k: limit,
                num_candidates: knnGroupSize,
            },
            query: {
                bool: {
                    must: {
                        multi_match: {
                            query,
                            fields: ['text'],
                            fuzziness: lexicalFuzziness,
                        },
                    },
                    filter: Object.keys(filters).length > 0 ? [filters] : [],
                },
            },
            rank: {
                rrf: {
                    rank_window_size: rrfWindowConstant,
                    rank_constant: rrfRankConstant,
                },
            },
            size: limit,
        };

        const indexName = `${index}-${this.workspaceId}`;

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

    async bulkIndexDocuments(documents: Chunk[]) {
        const body = documents.flatMap((doc) => [{ index: { _index: `${index}-${this.workspaceId}` } }, doc]);
        const response = await ElasticClient.client!.bulk({ refresh: true, body });
        return response?.items;
    }

    async deleteFiles(minioFileIds: string[]) {
        const indexName = `${index}-${this.workspaceId}`;
        return ElasticClient.client!.deleteByQuery({ index: indexName, query: { terms: { minio_file_id: minioFileIds } } });
    }
}

export default ElasticClient;
