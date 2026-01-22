import { BadRequestError, IEntity, IMongoEntityTemplate } from '@microservices/shared';
import { QueryResult } from 'neo4j-driver';
import { IEntityTreeNode } from '../../express/entities/interface';
import EntityTemplateService from '../../externalServices/templates/entityTemplateManager';
import { Node, nodeToEntity } from '../neo4j/lib';

type EdgeInfo = { toId: string; relationshipId: string; uniqueRelationShipId: string };
type AdjacencyList = Map<string, EdgeInfo[]>;
type EntityCache = Map<string, IEntity>;

const getOrCacheEntity = async (node: Node, cache: EntityCache, template: IMongoEntityTemplate): Promise<IEntity> => {
    const entityId = String(node.properties._id);
    const cached = cache.get(entityId);
    if (cached) return cached;

    const entity = await nodeToEntity(node, template);
    cache.set(entityId, entity);
    return entity;
};

const addBidirectionalEdge = (
    fromId: string,
    toId: string,
    relationshipId: string,
    uniqueRelationShipId: string,
    adjacencyList: AdjacencyList,
    processedEdges: Set<string>,
) => {
    const edgeKey = `${fromId}|${toId}|${uniqueRelationShipId}`;
    if (processedEdges.has(edgeKey)) return;

    processedEdges.add(edgeKey);
    const edges = adjacencyList.get(fromId);
    if (edges) {
        edges.push({ toId, relationshipId, uniqueRelationShipId });
    } else {
        adjacencyList.set(fromId, [{ toId, relationshipId, uniqueRelationShipId }]);
    }
};

/**
 * Recursively constructs the entity tree starting from a given node.
 * Handles cycle detection using visited nodes and ancestor templates.
 */
const constructEntityTreeNode = (
    nodeId: string,
    ancestorTemplates: Set<string>,
    entityCache: EntityCache,
    adjacencyList: AdjacencyList,
    visitedNodes: Set<string>,
): IEntityTreeNode => {
    const entity = entityCache.get(nodeId)!;
    const templateId = String(entity.templateId);

    if (visitedNodes.has(nodeId) || ancestorTemplates.has(templateId)) {
        visitedNodes.add(nodeId);
        return { ...entity, children: [] };
    }

    visitedNodes.add(nodeId);

    const updatedAncestors = new Set(ancestorTemplates).add(templateId);
    const edges = adjacencyList.get(nodeId) ?? [];

    const children = edges
        .filter(({ toId }) => !visitedNodes.has(toId))
        .map(({ toId, relationshipId }) => ({
            ...constructEntityTreeNode(toId, updatedAncestors, entityCache, adjacencyList, visitedNodes),
            relationshipId,
        }));

    return { ...entity, children };
};

/**
 * Builds a hierarchical entity tree from Neo4j query results.
 *
 * @param rootElementId - The ID of the root entity for the tree.
 * @returns A function that takes a Neo4j QueryResult and returns the constructed IEntityTreeNode or null.
 */
export const buildEntityTree =
    (rootElementId: string, workspaceId: string) =>
    async (result: QueryResult): Promise<IEntityTreeNode | null> => {
        const { records } = result;
        if (!records?.length) return null;

        const entityCache: EntityCache = new Map();
        const adjacencyList: AdjacencyList = new Map();
        const processedEdges = new Set<string>();

        for (const record of records) {
            const node1 = record.get('node1');
            const node2 = record.get('node2');
            const relationship = record.get('rel');
            if (!node1 || !node2 || !relationship) continue;

            const templateId1 = node1.labels[0];
            const entityTemplate1 = await new EntityTemplateService(workspaceId).getEntityTemplateById(templateId1);
            const templateId2 = node2.labels[0];
            const entityTemplate2 = await new EntityTemplateService(workspaceId).getEntityTemplateById(templateId2);

            const entity1 = await getOrCacheEntity(node1, entityCache, entityTemplate1);
            const entity2 = await getOrCacheEntity(node2, entityCache, entityTemplate2);

            const entityId1 = String(entity1.properties._id);
            const entityId2 = String(entity2.properties._id);
            const relationshipId = String(relationship.type);
            const uniqueRelationshipId = String(relationship.properties._id);

            addBidirectionalEdge(entityId1, entityId2, relationshipId, uniqueRelationshipId, adjacencyList, processedEdges);
            addBidirectionalEdge(entityId2, entityId1, relationshipId, uniqueRelationshipId, adjacencyList, processedEdges);
        }

        const rootEntity = entityCache.get(rootElementId);
        if (!rootEntity) {
            throw new BadRequestError(`RootId was not found in ${rootElementId} entities`);
        }

        const visitedNodes = new Set<string>();
        return constructEntityTreeNode(String(rootEntity.properties._id), new Set(), entityCache, adjacencyList, visitedNodes);
    };
