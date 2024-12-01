import { IEntityWithDirectRelationships, ISearchResult } from '../externalServices/instanceService/interfaces/entities';
import { ISemanticSearchResult } from '../externalServices/semanticSearch/interface';

const searchEntityPropertiesForQuery = (entityProps: IEntityWithDirectRelationships['entity']['properties'], query: string): string =>
    Object.values(entityProps).find((propValue: string) => query.toString().includes(propValue) || propValue.toString().includes(query));

export const formatEntitiesBulkSearch = (searchResults: ISearchResult, query: string, semanticSearchResult?: ISemanticSearchResult) => {
    const textsForReranking: string[] = [];

    const entitiesWithFileIds = searchResults.entities.map((entity) => {
        const {
            templateId,
            properties: { _id: entityId },
        } = entity.entity;
        const semanticResult = semanticSearchResult?.[templateId]?.[entityId];

        if (!semanticResult) {
            textsForReranking.push(searchEntityPropertiesForQuery(entity.entity.properties, query));
            return { ...entity };
        }

        return {
            ...entity,
            minioFileIds: semanticResult.map(({ minioFileId, text }) => {
                textsForReranking.push(text);
                return minioFileId;
            }),
        };
    });

    return { formattedEntities: { ...searchResults, entities: entitiesWithFileIds }, textsForReranking };
};
