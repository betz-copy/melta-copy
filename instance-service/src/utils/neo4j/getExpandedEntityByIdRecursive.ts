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

// TODO: Docs
export const expandEntityToNeoQuery = async (
    filters: IGetExpandedEntityBody['filters'],
    entityId: string,
    templateIds: IGetExpandedEntityBody['templateIds'],
    expandedParams: IGetExpandedEntityBody['expandedParams'],
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    mainId: string,
    disabled: boolean | null,
    isOnlyTemplateIds?: boolean,
) => {
    const fullFilters = fixFilters(filters, templateIds);
    const filterQuery = templatesFilterToNeoQuery(fullFilters, entityTemplatesMap);

    const filterCypherQuery = Object.keys(filters).length
        ? `WHERE apoc.meta.cypher.type(node) = "RELATIONSHIP" 
           OR ${filterQuery.cypherQuery} 
           OR node._id = '${mainId}'`
        : '';

    // TODO: move into fixFilters
    const disabledFilter = typeof disabled === 'boolean' ? `AND ALL(n IN nodes(path)[1..] WHERE n.disabled = $disabled)` : '';

    const returnBlock = isOnlyTemplateIds
        ? `
            WITH path,
                 relationships(path) AS rels
            WITH rels, [r IN rels | type(r)] AS relationshipIds, length(path) AS pathLength
            RETURN DISTINCT relationshipIds
          `
        : `
            RETURN elementsOfPath
          `;

    return {
        cypherQuery: `
             MATCH (p {_id:'${entityId}'})
            CALL apoc.path.spanningTree(p, {
                labelFilter: '${templateIds.join('|')}',
                minLevel: ${expandedParams[entityId].minLevel || 0},
                maxLevel: ${expandedParams[entityId].maxLevel || 1}
            })
            YIELD path
            WITH apoc.path.elements(path) AS elementsOfPath, path
            WITH elementsOfPath, path,
                 [node IN elementsOfPath ${filterCypherQuery} | node] AS filteredElementsOfPath
            WHERE size(filteredElementsOfPath) = size(elementsOfPath)
            ${disabledFilter}
            ${returnBlock}
        `,
        parameters: {
            ...filterQuery.parameters,
            ...(typeof disabled === 'boolean' ? { disabled } : {}),
        },
    };
};
