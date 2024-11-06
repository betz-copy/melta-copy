/* eslint-disable no-underscore-dangle */
import { Client, estypes } from '@elastic/elasticsearch';
import config from '../../config';
import { IElasticDoc } from '../../express/semantics/interface';
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
        topHitsByGroupSize,
        groupByEntityIdSize,
        rrfWindowFieldName,
    },
} = config;

interface IGroupByEntityIdAggregate {
    group_by_entity_id: estypes.AggregationsTermsAggregateBase<
        estypes.AggregationsAggregate & {
            top_hits_by_group: estypes.AggregationsTopHitsAggregate;
        }
    >;
}

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
                    workspaceId: { type: 'text' },
                    templateId: { type: 'text' },
                    entityId: { type: 'text' },
                    minioFileId: { type: 'text' },
                    chunkIndex: { type: 'integer' },
                },
            },
        });
    }

    deleteIndex() {
        return ElasticClient.client!.indices.delete({ index: `${config.elastic.index}-${this.workspaceId}` });
    }

    formatElasticResponse(response: estypes.SearchResponse<IElasticDoc, IGroupByEntityIdAggregate>): string[] {
        const { buckets } = response.aggregations!.group_by_entity_id;

        if (!buckets || !buckets[0]?.top_hits_by_group?.hits?.hits) return [];

        return buckets[0].top_hits_by_group.hits.hits.flatMap((hit) => hit?._source?.entityId ?? []);
    }

    async hybridSearch(query: string, embeddedQuery: number[], limit: number, skip: number, templates: string[]) {
        const filters = templates && templates.length > 0 ? { terms: { templateId: templates } } : {};

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
                    [rrfWindowFieldName]: rrfWindowConstant, // When merge to prod change to 'window_size'
                    rank_constant: rrfRankConstant,
                },
            },
            min_score: queryMinScore,
            aggs: {
                group_by_entity_id: {
                    terms: {
                        field: 'entityId.keyword',
                        size: groupByEntityIdSize,
                    },
                    aggs: {
                        top_hits_by_group: {
                            top_hits: {
                                size: topHitsByGroupSize,
                            },
                        },
                    },
                },
            },
        };

        const response = await ElasticClient.client!.search<IElasticDoc, IGroupByEntityIdAggregate>(searchBody);
        return this.formatElasticResponse(response);
    }

    async bulkIndexDocuments(documents: IElasticDoc[]) {
        const body = documents.flatMap((doc) => [{ index: { _index: `${index}-${this.workspaceId}` } }, doc]);
        const response = await ElasticClient.client!.bulk({ refresh: true, body });
        return response?.items;
    }

    async deleteFiles(minioFileIds: string[]) {
        const indexName = `${index}-${this.workspaceId}`;
        return ElasticClient.client!.deleteByQuery({ index: indexName, query: { terms: { minioFileId: minioFileIds } } });
    }
}

export default ElasticClient;
