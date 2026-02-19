import { IEntityWithDirectRelationships, ISearchBatchBody, ISearchResult, ISearchSort } from '@packages/entity';
import { IRerankResult, ISemanticSearchResult } from '@packages/semantic-search';
import excelConfig from './excel/excelConfig';

export type ISemanticSearchBatchBody = Omit<ISearchBatchBody, 'templates' | 'sort' | 'skip' | 'limit'> & {
    templates: string[];
    sort?: ISearchSort;
    skip?: number;
    limit?: number;
};

const PROPS_TO_SKIP = ['_id', 'updatedAt', 'createdAt'];

const convertDate = (date: string) => {
    return date.split('-').reverse().join('/');
};

const searchEntityPropertiesForQuery = (entityProps: IEntityWithDirectRelationships['entity']['properties'], query: string): string | undefined => {
    let nestedValue: string | undefined;

    const foundValue = Object.entries(entityProps).find(([key, propValue]) => {
        if (PROPS_TO_SKIP.includes(key)) return false;

        if (typeof propValue === 'boolean') {
            return propValue ? excelConfig.TRUE_TO_HEBREW.includes(query) : excelConfig.FALSE_TO_HEBREW.includes(query);
        }
        if (excelConfig.regexOfDateFormat.test(propValue.toString())) {
            return propValue.toString().includes(query) || convertDate(propValue).includes(query);
        }
        if (Array.isArray(propValue)) {
            return propValue.find((single) => single.toString().includes(query));
        }
        if (typeof propValue === 'object' && propValue.properties) {
            nestedValue = searchEntityPropertiesForQuery(propValue.properties, query);
            return nestedValue;
        }
        return propValue.toString().includes(query);
    });

    return nestedValue ?? foundValue?.[1];
};

const pushToTextsForReranking = (textsForReranking: Record<string, string[]>, text: string, entityId: string) => {
    if (!textsForReranking[text]) textsForReranking[text] = [];
    textsForReranking[text].push(entityId);
};

/**
 * Put minioFileIds (from semantic-service) into each of the entities.
 * Also create an array of the texts that match the query (from the entity or from the file) and the matching entityIds.
 * @param searchResults search results from instance service (neo4j)
 * @param query what the user searched for
 * @param semanticSearchResult search results from semantic service
 * @returns { formattedEntities: { count: number, formattedEntities: entitiyWithMinioFileId }, textsForReranking: { matchedText: entityIds[] } }
 */
export const formatEntitiesBulkSearch = (searchResults: ISearchResult, query: string, semanticSearchResult?: ISemanticSearchResult) => {
    // { text: entityIds[] }
    const textsForReranking: Record<string, string[]> = {};

    const entitiesWithFileIds = searchResults.entities.map((entity) => {
        const {
            templateId,
            properties: { _id: entityId },
        } = entity.entity;
        const semanticResult = semanticSearchResult?.[templateId]?.[entityId];

        if (!semanticResult) {
            const text = searchEntityPropertiesForQuery(entity.entity.properties, query);
            pushToTextsForReranking(textsForReranking, text ?? query, entityId);

            return { ...entity };
        }

        return {
            ...entity,
            minioFileIdsWithTexts: semanticResult.map(({ minioFileId, text }) => {
                pushToTextsForReranking(textsForReranking, text, entityId);

                return { minioFileId, text };
            }),
        };
    });

    return { formattedEntities: { ...searchResults, entities: entitiesWithFileIds }, textsForReranking };
};

/**
 * Create an object with text as key, and entityIds as value.
 * @param searchResults search results from instance service (neo4j)
 * @param entitiesWithFiles search results from semantic service on specific template
 * @param query what the user searched for
 * @returns Record<string, string[]>, example: { text1: entityIds1[], text2: entityIds2[], ... }
 */
export const createTextsFromEntitiesWithFiles = (
    searchResults: ISearchResult,
    entitiesWithFiles: ISemanticSearchResult[string],
    query: string,
): Record<string, string[]> =>
    searchResults.entities.reduce((acc, entity) => {
        const {
            properties: { _id: entityId },
        } = entity.entity;

        if (!entitiesWithFiles[entityId]) {
            const text = searchEntityPropertiesForQuery(entity.entity.properties, query);
            pushToTextsForReranking(acc, text ?? query, entityId);
        } else {
            entitiesWithFiles[entityId].forEach(({ text }) => {
                pushToTextsForReranking(acc, text, entityId);
            });
        }

        return acc;
    }, {});

/**
 * Order formattedEntities by the rerankByDocs array (which contains the texts in the order they should be)
 * @param formattedEntities entities with minioFileIdsWithTexts like {minioFileIdsWithTexts: [{minioFileId: string, text: string}]}
 * @param rerankByDocs from semantic service ({ text: string, index: number })
 * @param textsForReranking object containing each text with its corresponding entityIds
 * @returns sorted formattedEntities
 */
export const sortEntities = (
    formattedEntities: (IEntityWithDirectRelationships & { minioFileIdsWithTexts?: ISemanticSearchResult[string][string] })[],
    rerankByDocs: IRerankResult[],
    textsForReranking: Record<string, string[]>,
) =>
    rerankByDocs.flatMap(({ text }) => {
        const entityIds = textsForReranking[text];

        return formattedEntities.filter(
            ({
                entity: {
                    properties: { _id: entityId },
                },
            }) => entityIds.includes(entityId),
        );
    });
