/* eslint-disable no-underscore-dangle */
import { Client } from '@elastic/elasticsearch';
import config from '../../config';
import { Chunk } from '../../express/semantics/interface';
import logger from '../logger/logsLogger';

const {
    elastic: {
        index,
        url,
        vectorDims,
        similarityAlgorithm,
        knnGroupSize,
        lexicalFuzziness,
        rrfWindowConstant,
        queryMinScore,
        rrfRankConstant,
        user,
        password,
    },
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
            ElasticClient.client = new Client({ node: url, auth: { username: user, password } });

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

    async formatElasticHits(hits: any[]) {
        return hits.map((hit) => ({
            text: hit._source.text,
            title: hit._source.title,
            template_id: hit._source.template_id,
            entity_id: hit._source.entity_id,
            minio_file_id: hit._source.minio_file_id,
            workspace_id: hit._source.workspace_id,
        }));
    }

    async hybridSearch(query: string, embeddedQuery: number[], limit: number, skip: number, templates: string[]) {
        const filters = templates && templates.length > 0 ? { terms: { template_id: templates } } : {};

        const indexName = `${index}-${this.workspaceId}`;
        const searchBody = {
            index: indexName,
            from: skip,
            size: limit,
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
            knn: {
                field: 'embedding',
                query_vector: embeddedQuery,
                k: limit,
                num_candidates: knnGroupSize,
            },
            rank: {
                rrf: {
                    window_size: rrfWindowConstant,
                    rank_constant: rrfRankConstant,
                },
            },
            min_score: queryMinScore,
            aggs: {
                group_by_entity_id: {
                    terms: {
                        field: 'entity_id',
                        size: 100,
                    },
                    aggs: {
                        top_hits_by_group: {
                            top_hits: {
                                size: 1,
                                sort: [{ _score: { order: 'desc' } }],
                            },
                        },
                    },
                },
            },
        };

        const response = await ElasticClient.client!.search(searchBody);

        return { results: this.formatElasticHits(response.hits.hits), count: 0 };
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
