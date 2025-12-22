import { IGetExpandedEntityBody } from '../../express/entities/interface';

/**
 * Generates a Cypher query to retrieve a spanning tree of entities starting from a root entity.
 * The tree is filtered by template IDs and optionally by relationship IDs.
 * It returns aggregated information about the relationships found in the tree.
 *
 * @param entityId - The ID of the root entity to start the spanning tree from.
 * @param templateIds - A list of template IDs to include in the tree (used as label filters).
 * @param relationshipIds - An optional list of relationship IDs to filter the traversal.
 * @param expandedParams - Configuration object containing expansion depth (minLevel, maxLevel) for the entity.
 * @returns An object containing the generated `cypherQuery` string and an empty `parameters` object.
 */
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
            RETURN relationshipIds, type(r) + "&" + r._id AS relationshipKey, count(*) AS entitiesCount
        `,
        parameters: {},
    };
};

export const getEntitiesForPrintByRelIds = (relationshipIds: string[], isShowDisabled: boolean) => {
    const disabledClause = isShowDisabled ? '' : 'AND node1.disabled = false AND node2.disabled = false';

    return {
        cypherQuery: `
            MATCH (node1)-[rel]-(node2)
            WHERE rel._id IN $relationshipIds
            ${disabledClause}
            RETURN node1, rel, node2
        `,
        parameters: { relationshipIds },
    };
};
