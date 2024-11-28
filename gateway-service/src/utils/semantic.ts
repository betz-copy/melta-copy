import { IEntityWithDirectRelationships, ISearchResult } from '../externalServices/instanceService/interfaces/entities';
import { ISemanticSearchResult } from '../externalServices/semanticSearch/interface';

const searchEntityPropertiesForQuery = (entity: IEntityWithDirectRelationships, query: string): string =>
    Object.values(entity.entity.properties).find((propValue: string) => query.toString().includes(propValue) || propValue.toString().includes(query));

export const formatEntitiesSearch = (searchResults: ISearchResult, query: string, semanticSearchResult?: ISemanticSearchResult) => {
    const textsForReranking: string[] = [];

    const entitiesWithFileIds = searchResults.entities.map((entity) => {
        const isSemanticResult = semanticSearchResult?.[entity.entity.templateId]?.[entity.entity.properties._id];

        if (!isSemanticResult) {
            textsForReranking.push(searchEntityPropertiesForQuery(entity, query));
            return { ...entity };
        }

        return {
            ...entity,
            minioFileIds: semanticSearchResult?.[entity.entity.templateId]?.[entity.entity.properties._id].map(({ minioFileId, text }) => {
                textsForReranking.push(text);
                return minioFileId;
            }),
        };
    });

    return { formattedEntities: { ...searchResults, entities: entitiesWithFileIds }, textsForReranking };
};
