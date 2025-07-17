/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { IMongoEntityTemplate, IEntityExpanded } from '@microservices/shared';
import { IGetExpandedEntityBody } from '../../express/entities/interface';
import { templatesFilterToNeoQuery } from './searchBodyToNeoQuery';
import Neo4jClient from '.';
import { normalizeReturnedRelAndEntities } from './lib';

export const expandEntityToNeoQuery = async (
    filters: IGetExpandedEntityBody['filters'],
    entityId: string,
    templateIds: IGetExpandedEntityBody['templateIds'],
    expandedParams: IGetExpandedEntityBody['expandedParams'],
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    mainId: string,
) => {
    const templateIdsWithFilter = Object.keys(filters);
    const emptyFilters = templateIds?.filter((templateId) => !templateIdsWithFilter.includes(templateId));
    const mappedRecords: IGetExpandedEntityBody['filters'] = emptyFilters?.reduce((acc: any, currentId) => {
        // eslint-disable-next-line no-param-reassign
        acc[currentId] = {};
        return acc;
    }, {});
    const fullFilters = { ...mappedRecords, ...filters };
    const filterQuery = templatesFilterToNeoQuery(fullFilters, entityTemplatesMap);
    const filterCypherQuery = Object.keys(filters).length
        ? `WHERE apoc.meta.cypher.type(node) = "RELATIONSHIP" OR ${filterQuery.cypherQuery} OR node._id ='${mainId}' `
        : '';

    return {
        cypherQuery: `MATCH (p {_id:'${entityId}'})
                        CALL apoc.path.expandConfig(p, {
                       labelFilter: '${templateIds.join('|')}',
                       minLevel: ${expandedParams.minLevel[entityId] || 0},
                       maxLevel: ${expandedParams.maxLevel[entityId] || 1}
                    })
                    YIELD path
                    with apoc.path.elements(path) as elementsOfPath
                    with *, [node in elementsOfPath ${filterCypherQuery} | node] as filteredElementsOfPath
                    where size(filteredElementsOfPath) = size(elementsOfPath)
                    RETURN elementsOfPath`,
        parameters: { ...filterQuery.parameters },
    };
};

export const getExpandedFilteredGraphRecursively = async (
    neo4jClient: Neo4jClient,
    disabled: IGetExpandedEntityBody['disabled'],
    initialExpandedEntity: IEntityExpanded,
    searchBody: IGetExpandedEntityBody['filters'],
    templateIds: IGetExpandedEntityBody['templateIds'],
    expandedParams: IGetExpandedEntityBody['expandedParams'],
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
): Promise<IEntityExpanded> => {
    const initialExpandedEntityId = initialExpandedEntity.entity.properties._id;
    const existingConnectionIds = new Set<string>(initialExpandedEntity.connections.map((connection) => connection.relationship.properties._id));
    const expanded = new Set<string>([initialExpandedEntityId]);

    const connections = [...initialExpandedEntity.connections];

    const entityIdsToExpand: string[] = initialExpandedEntity.connections
        .map(({ sourceEntity, destinationEntity }) => {
            const otherEntity = initialExpandedEntityId === sourceEntity.properties._id ? destinationEntity : sourceEntity;
            return otherEntity.properties._id;
        })
        .filter((otherEntityId) => expandedParams[otherEntityId].maxLevel && !expanded.has(otherEntityId));

    for (const entityIdToExpand of entityIdsToExpand) {
        const searchCypherQuery = await expandEntityToNeoQuery(
            searchBody,
            entityIdToExpand,
            templateIds,
            expandedParams,
            entityTemplatesMap,
            initialExpandedEntityId,
        );
        const currFilteredExpandedEntity = await neo4jClient.readTransaction(
            searchCypherQuery.cypherQuery,
            normalizeReturnedRelAndEntities(disabled),
            searchCypherQuery.parameters,
        );
        if (currFilteredExpandedEntity) {
            currFilteredExpandedEntity.connections.forEach((newConnection) => {
                if (!existingConnectionIds.has(newConnection.relationship.properties._id)) connections.push(newConnection);
            });
            expanded.add(entityIdToExpand);
            currFilteredExpandedEntity.connections.forEach(({ sourceEntity, destinationEntity }) => {
                const otherEntity = entityIdToExpand === sourceEntity.properties._id ? destinationEntity : sourceEntity;
                const otherEntityId = otherEntity.properties._id;
                if (expandedParams[otherEntityId].maxLevel && !expanded.has(otherEntityId)) entityIdsToExpand.push(otherEntityId);
            });
        }
    }
    return { entity: initialExpandedEntity.entity, connections };
};
