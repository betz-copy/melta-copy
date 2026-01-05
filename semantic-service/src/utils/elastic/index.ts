/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
import { Client, estypes } from '@elastic/elasticsearch';
import { ISemanticSearchResult } from '@packages/semantic-search';
import { logger } from '@packages/utils';
import config from '../../config';
import { IElasticDoc } from '../../express/semantics/interface';

const {
    elastic: {
        index,
        url,
        vectorDims,
        similarityAlgorithm,
        lexicalFuzziness,
        queryMinScore,
        knnGroupSize,
        rrfWindowConstant,
        rrfRankConstant,
        rrfWindowFieldName,
        user,
        password,
        uniqueEntityForAggSize,
        topHitsByGroupSize,
        uniqueEntityForAgg,
    },
    minio: { useDevBucket, devBucketPrefix },
} = config;

interface IGroupByUniquePropAggregate {
    group_by_unique_prop: estypes.AggregationsTermsAggregateBase<
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
        this.createIndex()
            .then(() => {
                logger.info(`Index created successfully: ${index}-${useDevBucket ? devBucketPrefix : ''}${this.workspaceId}`);
            })
            .catch((error) => {
                logger.error('Error creating index:', { error });
            });
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
        const fixedIndexName = `${index}-${useDevBucket ? devBucketPrefix : ''}${this.workspaceId}`;
        return ElasticClient.client!.indices.create({
            index: fixedIndexName,
            mappings: {
                properties: {
                    embedding: {
                        type: 'dense_vector',
                        dims: vectorDims,
                        index: true,
                        similarity: similarityAlgorithm as estypes.MappingDenseVectorSimilarity,
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

    formatElasticResponse(response: estypes.SearchResponse<IElasticDoc, IGroupByUniquePropAggregate>): ISemanticSearchResult {
        if (!response?.aggregations?.group_by_unique_prop?.buckets) return {};

        const buckets = response.aggregations.group_by_unique_prop.buckets as Array<{
            key: string;
            top_hits_by_group: estypes.AggregationsTopHitsAggregate;
        }>;

        return buckets.reduce((acc, { top_hits_by_group }) => {
            top_hits_by_group.hits.hits.forEach((hit) => {
                const { templateId, minioFileId, entityId, text } = hit?._source ?? { templateId: '', minioFileId: '', entityId: '', text: '' };

                if (!templateId || !minioFileId || !entityId) return;

                if (!acc[templateId]) acc[templateId] = {};
                if (!acc[templateId][entityId]) acc[templateId][entityId] = [];

                acc[templateId][entityId].push({ minioFileId, text });
            });

            return acc;
        }, {} as ISemanticSearchResult);
    }

    async hybridSearch(query: string, embeddedQuery: number[], limit: number, skip: number, templates: string[]) {
        const filter = templates?.length > 0 ? [{ terms: { templateId: templates } }] : [];

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
                    filter,
                },
            },
            knn: {
                field: 'embedding',
                query_vector: embeddedQuery,
                k: limit,
                num_candidates: knnGroupSize,
                filter,
            },
            rank: {
                rrf: {
                    [rrfWindowFieldName]: rrfWindowConstant,
                    rank_constant: rrfRankConstant,
                },
            },
            min_score: queryMinScore,
            // Group by unique values
            aggs: {
                group_by_unique_prop: {
                    terms: {
                        field: `${uniqueEntityForAgg}.keyword`,
                        size: uniqueEntityForAggSize, // Control how many of the unique values to return.
                    },
                    aggs: {
                        top_hits_by_group: {
                            top_hits: {
                                size: topHitsByGroupSize, // Control how many documents are allowed to return within each group.
                                sort: [
                                    {
                                        _score: {
                                            order: 'desc', // Sorts by score in descending order.
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        };

        try {
            const response = await ElasticClient.client!.search<IElasticDoc, IGroupByUniquePropAggregate>(searchBody);
            return this.formatElasticResponse(response);
        } catch (error) {
            logger.error('Error searching in ElasticSearch:', { error });
            return undefined;
        }
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
