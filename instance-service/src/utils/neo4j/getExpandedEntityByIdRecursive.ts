/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { IMongoEntityTemplate, ISearchBatchBody } from '@microservices/shared';
import { IGetExpandedEntityBody } from '../../express/entities/interface';
import { templatesFilterToNeoQuery } from './searchBodyToNeoQuery';

const fixFilters = (
    filters: IGetExpandedEntityBody['filters'],
    templateIds: IGetExpandedEntityBody['templateIds'],
): ISearchBatchBody['templates'] => {
    return templateIds.reduce(
        (acc, templateId) => ({
            ...acc,
            [templateId]: filters?.[templateId] ?? {},
        }),
        {},
    );
};

/**
 * Generates the Cypher query for filtering nodes in the path.
 */
const generateFilterClause = (filters: IGetExpandedEntityBody['filters'], filterQuery: { cypherQuery: string }, mainId: string): string => {
    if (Object.keys(filters).length === 0) return '';

    return `WHERE apoc.meta.cypher.type(node) = "RELATIONSHIP" 
           OR ${filterQuery.cypherQuery} 
           OR node._id = '${mainId}'`;
};

/**
 * Generates the configuration object string for apoc.path.spanningTree.
 */
const generateSpanningTreeConfig = (
    entityId: string,
    templateIds: string[],
    relationshipIds: string[] | undefined,
    expandedParams: IGetExpandedEntityBody['expandedParams'],
): string => {
    const params = expandedParams[entityId];
    const minLevel = params?.minLevel ?? 0;
    const maxLevel = params?.maxLevel ?? 1;
    const relFilter = relationshipIds?.length ? `, relationshipFilter: '${relationshipIds.join('|')}'` : '';

    return `{
                labelFilter: '${templateIds.join('|')}',
                minLevel: ${minLevel},
                maxLevel: ${maxLevel}
                ${relFilter}
            }`;
};

/**
 * Constructs a Neo4j Cypher query to expand an entity based on templates, relationships, and filters.
 *
 * @param filters - Filters to apply to the expanded entities.
 * @param entityId - The ID of the root entity to expand.
 * @param templateIds - List of template IDs to include in the expansion.
 * @param relationshipIds - List of relationship IDs to traverse.
 * @param expandedParams - Configuration for expansion depth per entity.
 * @param entityTemplatesMap - Map of entity templates for filter generation.
 * @param mainId - The ID of the main entity (to ensure it's always included).
 * @returns An object containing the Cypher query string and its parameters.
 */
export const expandEntityToNeoQuery = (
    filters: IGetExpandedEntityBody['filters'],
    entityId: string,
    templateIds: IGetExpandedEntityBody['templateIds'],
    relationshipIds: IGetExpandedEntityBody['relationshipIds'],
    expandedParams: IGetExpandedEntityBody['expandedParams'],
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    mainId: string,
) => {
    const fullFilters = fixFilters(filters, templateIds);
    const filterQuery = templatesFilterToNeoQuery(fullFilters, entityTemplatesMap);

    const filterClause = generateFilterClause(filters, filterQuery, mainId);
    const spanningTreeConfig = generateSpanningTreeConfig(entityId, templateIds, relationshipIds, expandedParams);

    return {
        cypherQuery: `
            MATCH (p {_id:'${entityId}'})
            CALL apoc.path.spanningTree(p, ${spanningTreeConfig})
            YIELD path
            WITH apoc.path.elements(path) AS elementsOfPath, path
            WITH elementsOfPath, path,
                 [node IN elementsOfPath ${filterClause} | node] AS filteredElementsOfPath
            WHERE size(filteredElementsOfPath) = size(elementsOfPath)
            RETURN elementsOfPath
        `,
        parameters: {
            ...filterQuery.parameters,
        },
    };
};
