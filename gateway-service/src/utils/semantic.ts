import { IEntityWithDirectRelationships, ISearchResult } from '../externalServices/instanceService/interfaces/entities';
import { IRerankResult, ISemanticSearchResult } from '../externalServices/semanticSearch/interface';

const searchEntityPropertiesForQuery = (entityProps: IEntityWithDirectRelationships['entity']['properties'], query: string): string =>
    Object.values(entityProps).find((propValue: string) => query.toString().includes(propValue) || propValue.toString().includes(query));

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

            if (!textsForReranking[text]) textsForReranking[text] = [];
            textsForReranking[text].push(entityId);

            return { ...entity };
        }

        return {
            ...entity,
            minioFileIds: semanticResult.map(({ minioFileId, text }) => {
                if (!textsForReranking[text]) textsForReranking[text] = [];
                textsForReranking[text].push(entityId);

                return minioFileId;
            }),
        };
    });

    return { formattedEntities: { ...searchResults, entities: entitiesWithFileIds }, textsForReranking };
};

export const sortEntities = (
    formattedEntities: (IEntityWithDirectRelationships & { minioFileIds?: string[] })[],
    rerankByDocs: IRerankResult[],
    textsForReranking: Record<string, string[]>,
) =>
    rerankByDocs
        .map(({ text }) => {
            const entityIds = textsForReranking[text];

            return formattedEntities.filter(
                ({
                    entity: {
                        properties: { _id: entityId },
                    },
                }) => entityIds.includes(entityId),
            );
        })
        .flat();
