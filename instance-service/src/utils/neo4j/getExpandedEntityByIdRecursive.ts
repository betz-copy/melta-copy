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

export const getOnlyTemplateIdsTree = (
    entityId: string,
    templateIds: IGetExpandedEntityBody['templateIds'],
    relationshipIds: IGetExpandedEntityBody['relationshipIds'],
    expandedParams: IGetExpandedEntityBody['expandedParams'],
) => {
    return {
        cypherQuery: `
            MATCH (p {_id:'${entityId}'})
            CALL apoc.path.spanningTree(p, {
                labelFilter: '${templateIds.join('|')}',
                minLevel: ${expandedParams[entityId].minLevel || 0},
                maxLevel: ${expandedParams[entityId].maxLevel || 1}
                ${relationshipIds?.length ? `, relationshipFilter: '${relationshipIds.join('|')}'` : ''}
            })
            YIELD path

            WITH relationships(path) AS rels
            WITH [r IN rels | type(r) + "&" + r._id] AS relationshipIds, rels

            UNWIND rels AS r
            WITH relationshipIds, type(r) + "&" + r._id AS relationshipKey, endNode(r)._id AS nodeId

            RETURN relationshipIds, relationshipKey, count(DISTINCT nodeId) AS entitiesCount
        `,
        parameters: {},
    };
};

export const getEntitiesForPrintByRelIds = (relationshipIds: string[]) => {
    return {
        cypherQuery: `
            MATCH (node1)-[rel]-(node2)
            WHERE rel._id IN $relationshipIds
            RETURN node1, rel, node2
        `,
        parameters: { relationshipIds },
    };
};

// TODO: Docs
export const expandEntityToNeoQuery = (
    filters: IGetExpandedEntityBody['filters'],
    entityId: string,
    templateIds: IGetExpandedEntityBody['templateIds'],
    relationshipIds: IGetExpandedEntityBody['relationshipIds'],
    expandedParams: IGetExpandedEntityBody['expandedParams'],
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    mainId: string,
    isShowDisabled: boolean | null,
) => {
    const fullFilters = fixFilters(filters, templateIds);
    const filterQuery = templatesFilterToNeoQuery(fullFilters, entityTemplatesMap);

    const filterCypherQuery = Object.keys(filters).length
        ? `WHERE apoc.meta.cypher.type(node) = "RELATIONSHIP" 
           OR ${filterQuery.cypherQuery} 
           OR node._id = '${mainId}'`
        : '';

    // TODO: move into fixFilters
    const disabledFilter = isShowDisabled ? '' : `AND ALL(n IN nodes(path)[1..] WHERE n.disabled = false)`;

    return {
        cypherQuery: `
             MATCH (p {_id:'${entityId}'})
            CALL apoc.path.spanningTree(p, {
                labelFilter: '${templateIds.join('|')}',
                minLevel: ${expandedParams[entityId].minLevel || 0},
                maxLevel: ${expandedParams[entityId].maxLevel || 1}
                ${relationshipIds?.length ? `, relationshipFilter: '${relationshipIds.join('|')}'` : ''}
            })
            YIELD path
            WITH apoc.path.elements(path) AS elementsOfPath, path
            WITH elementsOfPath, path,
                 [node IN elementsOfPath ${filterCypherQuery} | node] AS filteredElementsOfPath
            WHERE size(filteredElementsOfPath) = size(elementsOfPath)
            ${disabledFilter}
            RETURN elementsOfPath
        `,
        parameters: {
            ...filterQuery.parameters,
        },
    };
};
