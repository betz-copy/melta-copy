import { IMongoEntityTemplate, IMongoRelationshipTemplate } from '@microservices/shared';
import { QueryResult } from 'neo4j-driver';
import config from '../../config';
import { IRelationShipTreeNode, ITreeNodeMap } from '../../express/entities/interface';

const {
    neo4j: { relationshipPathSeparator },
} = config;

type EntitiesCountMap = Map<string, number>;

const buildEntitiesCountMap = (records: QueryResult['records']): EntitiesCountMap => {
    const countMap = new Map<string, number>();

    for (const record of records) {
        const key = record.get('relationshipKey');
        const count = record.get('entitiesCount');
        countMap.set(key, count?.toNumber?.() ?? count);
    }

    return countMap;
};

/**
 * Recursively inserts a path into the tree map structure.
 * Merges existing nodes and updates relationship IDs.
 */
const insertPathIntoTree = (treeMap: ITreeNodeMap, [head, ...tail]: string[]): void => {
    if (!head) return;

    const [type, id] = head.split(relationshipPathSeparator);
    const existingNode = treeMap.get(type);

    if (existingNode) {
        treeMap.set(type, {
            ...existingNode,
            neoRelIds: new Set([...existingNode.neoRelIds, id]),
        });
    } else {
        treeMap.set(type, {
            _id: head,
            children: new Map(),
            neoRelIds: new Set([id]),
        });
    }

    insertPathIntoTree(treeMap.get(type)!.children, tail);
};

const buildTreeRoots = (paths: string[][]): ITreeNodeMap => {
    const roots: ITreeNodeMap = new Map();
    for (const path of paths) {
        insertPathIntoTree(roots, path);
    }
    return roots;
};

/**
 * Calculates the total number of entities for a specific relationship node
 * by summing counts of all its underlying Neo4j relationships.
 */
const calculateEntitiesCount = (neoRelIds: Set<string>, mongoRelId: string, entitiesCountMap: EntitiesCountMap): number =>
    [...neoRelIds].reduce((sum, relId) => sum + (entitiesCountMap.get(`${mongoRelId}${relationshipPathSeparator}${relId}`) ?? 0), 0);

/**
 * Recursively constructs the full relationship tree nodes.
 * Iterates over the tree map and builds nodes using `buildRelationshipNode`.
 */
const constructRelationshipTree = (
    treeMap: ITreeNodeMap,
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    relationShipsMap: Map<string, IMongoRelationshipTemplate>,
    entitiesCountMap: EntitiesCountMap,
    currentPath = '',
    depth = 0,
    ancestorEntities = new Set<string>(),
): IRelationShipTreeNode[] => {
    const nodes: IRelationShipTreeNode[] = [];

    for (const treeNode of treeMap.values()) {
        const node = buildRelationshipNode(treeNode, currentPath, depth, ancestorEntities, entityTemplatesMap, relationShipsMap, entitiesCountMap);

        if (node) nodes.push(node);
    }

    return nodes;
};

/**
 * Constructs a single relationship tree node.
 * Resolves templates, handles cycle detection, and builds children recursively.
 */
const buildRelationshipNode = (
    treeNode: ReturnType<ITreeNodeMap['get']>,
    currentPath: string,
    depth: number,
    ancestorEntities: Set<string>,
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    relationShipsMap: Map<string, IMongoRelationshipTemplate>,
    entitiesCountMap: EntitiesCountMap,
): IRelationShipTreeNode | null => {
    if (!treeNode) return null;

    const mongoRelId = treeNode?._id.split(relationshipPathSeparator)[0];
    const nodePath = currentPath ? `${currentPath}${relationshipPathSeparator}${mongoRelId}` : mongoRelId;

    const relationship = relationShipsMap.get(mongoRelId);
    if (!relationship) return null;

    const sourceTemplate = entityTemplatesMap.get(relationship.sourceEntityId);
    const destinationTemplate = entityTemplatesMap.get(relationship.destinationEntityId);
    if (!sourceTemplate || !destinationTemplate) return null;

    const updatedAncestors = new Set(ancestorEntities).add(sourceTemplate._id);

    // Cycle Detection:
    // If the destination entity is already in the ancestor path, we stop recursion here.
    // The current node is still created (to show the relationship), but it will have no children.
    const children = updatedAncestors.has(destinationTemplate._id)
        ? []
        : constructRelationshipTree(
              treeNode.children,
              entityTemplatesMap,
              relationShipsMap,
              entitiesCountMap,
              nodePath,
              depth + 1,
              new Set(updatedAncestors).add(destinationTemplate._id),
          );

    const entitiesCount = calculateEntitiesCount(treeNode.neoRelIds, mongoRelId, entitiesCountMap);

    return {
        ...relationship,
        neoRelIds: [...treeNode.neoRelIds],
        sourceEntity: sourceTemplate,
        destinationEntity: destinationTemplate,
        depth,
        entitiesCount,
        path: nodePath,
        children,
    };
};

/**
 * Main function to build the hierarchical relationship template tree from Neo4j query results.
 * Processes paths, counts, and constructs the final tree structure.
 */
export const buildTemplateTree =
    (entityTemplatesMap: Map<string, IMongoEntityTemplate>, relationShipsMap: Map<string, IMongoRelationshipTemplate>) =>
    (result: QueryResult): IRelationShipTreeNode[] => {
        if (!result.records.length) return [];

        const relationshipPaths = result.records.map((record) => record.get('relationshipIds'));
        const entitiesCountMap = buildEntitiesCountMap(result.records);
        const treeRoots = buildTreeRoots(relationshipPaths);

        return constructRelationshipTree(treeRoots, entityTemplatesMap, relationShipsMap, entitiesCountMap);
    };
