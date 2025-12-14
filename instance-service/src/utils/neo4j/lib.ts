import {
    ActionErrors,
    IEntity,
    IEntityExpanded,
    IEntityWithDirectRelationships,
    IMongoEntityTemplate,
    IMongoRelationshipTemplate,
    IRelationship,
    SplitBy,
    ValidationError,
} from '@microservices/shared';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { IEntityTreeNode, IRelationShipTreeNode, ITreeNodeMap } from 'instance-service/src/express/entities/interface';
import neo4j, { Node as Neo4jNode, Relationship as Neo4jRelationship, QueryResult, Transaction } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import EntityManager from '../../express/entities/manager';
import { IFormulaCauses } from '../../express/rules/interfaces/formulaWithCauses';

const {
    map: {
        polygon: { polygonPrefix, polygonSuffix },
        srid,
    },
    timezone,
    neo4j: {
        stringPropertySuffix,
        colorPropertySuffix,
        booleanPropertySuffix,
        filePropertySuffix,
        locationCoordinateSystemSuffix,
        usersFieldsPropertySuffix,
        usersArrayOriginalAndSuffixFieldsMap,
        userFieldPropertySuffix,
        userOriginalAndSuffixFieldsMap,
    },
} = config;

type Node = Neo4jNode<number>;
type Relationship = Neo4jRelationship<number>;

/**
 *
 * @param date
 * @returns Date in YYYY-MM-DD Format
 */
export const formatDate = (date: string) => {
    return date.slice(0, 10);
};
/**
 * Fix the values of an entity that is saved in neo4j to its original values.
 * For example dates and fixing the user fields to be without the suffix.
 */
export const normalizeFields = (properties: Record<string, any>): { properties: Record<string, any>; coloredFields: Record<string, string> } => {
    const props = {};
    const coloredFields = {};

    const usersArrayKeys: Set<string> = new Set<string>();
    const userKeys: Set<string> = new Set<string>();

    Object.entries(properties).forEach(([key, value]) => {
        const suffixes = [stringPropertySuffix, booleanPropertySuffix, filePropertySuffix, locationCoordinateSystemSuffix];

        if (suffixes.some((suffix) => key.endsWith(suffix))) return;

        if (key.endsWith(colorPropertySuffix) && properties[key] !== undefined) coloredFields[key.slice(0, -colorPropertySuffix.length)] = value;

        if (key.includes('.') && key.endsWith(`${usersFieldsPropertySuffix}`)) {
            // Find the user field of the key (everything before the suffix)
            const currentUserField = usersArrayOriginalAndSuffixFieldsMap.find(({ suffixFieldName }) =>
                key.includes(suffixFieldName),
            )!.suffixFieldName;
            usersArrayKeys.add(key.split(currentUserField)[0]);
            return;
        }

        if (key.includes('.') && key.endsWith(`${userFieldPropertySuffix}`)) {
            const currentUserField = userOriginalAndSuffixFieldsMap.find(({ suffixFieldName }) => key.includes(suffixFieldName))!.suffixFieldName;
            userKeys.add(key.split(currentUserField)[0]);
            return;
        }

        if (value instanceof neo4j.types.LocalDateTime) {
            props[key] = fromZonedTime(new Date(value.toString()), timezone).toISOString();

            return;
        }

        if (value instanceof neo4j.types.Date) {
            props[key] = formatDate(value.toString());

            return;
        }

        if (value instanceof neo4j.types.Point) {
            props[key] = { location: `${value.x}, ${value.y}`, coordinateSystem: properties[`${key}${locationCoordinateSystemSuffix}`] };

            return;
        }
        if (Array.isArray(value) && value.every((item) => item instanceof neo4j.types.Point)) {
            const points = value.map((point) => `${point.x} ${point.y}`);
            props[key] = {
                location: `${polygonPrefix}${points.join(',')}${polygonSuffix}`,
                coordinateSystem: properties[`${key}${locationCoordinateSystemSuffix}`],
            };

            return;
        }

        props[key] = value;
    });

    if (usersArrayKeys.size) {
        usersArrayKeys.forEach((userKey) => {
            props[userKey] = properties[`${userKey}${usersArrayOriginalAndSuffixFieldsMap[0].suffixFieldName}${usersFieldsPropertySuffix}`].map(
                (_id: string, index: string | number) => {
                    const objToReturn: any = {};

                    usersArrayOriginalAndSuffixFieldsMap.forEach((userField) => {
                        objToReturn[userField.originalFieldName] =
                            properties[`${userKey}${userField.suffixFieldName}${usersFieldsPropertySuffix}`][index];
                    });

                    return JSON.stringify({
                        ...objToReturn,
                    });
                },
            );
        });
    }

    if (userKeys.size) {
        userKeys.forEach((userKey) => {
            const objToReturn: any = {};

            userOriginalAndSuffixFieldsMap.forEach((userField) => {
                objToReturn[userField.originalFieldName] = properties[`${userKey}${userField.suffixFieldName}${userFieldPropertySuffix}`];
            });

            props[userKey] = JSON.stringify({
                ...objToReturn,
            });
        });
    }

    return { properties: props, coloredFields };
};

type ResponseType = 'singleResponse' | 'singleResponseNotNullable' | 'multipleResponses';
type Response<ResType extends ResponseType, Data> = ResType extends 'singleResponse'
    ? Data | null
    : ResType extends 'singleResponseNotNullable'
      ? Data
      : ResType extends 'multipleResponses'
        ? Data[]
        : never;

const nodeToEntity = (node: Node): IEntity => {
    const { properties, coloredFields } = normalizeFields(node.properties);
    return {
        templateId: node.labels[0],
        properties: EntityManager.fixReturnedEntityReferencesFields(properties),
        coloredFields,
    };
};

export const normalizeReturnedEntity =
    <T extends ResponseType>(response: T) =>
    (result: QueryResult): Response<T, IEntity> => {
        const entities = result.records.map((record) => nodeToEntity(record.get(0) as Node));

        if (['singleResponse', 'singleResponseNotNullable'].includes(response))
            return (entities.length > 0 ? entities[0] : null) as Response<T, IEntity>;

        return entities as Response<T, IEntity>;
    };

export const normalizeSearchByLocationResponse = (result: QueryResult): Array<{ node: IEntity; matchingFields: string[] }> => {
    return result.records.map((record) => ({
        node: nodeToEntity(record.get(0) as Node),
        matchingFields: record.get(1) as string[],
    }));
};

export const normalizeResponseCount = (result: QueryResult): number => {
    return result.records[0].get(0);
};

export const normalizeChartResponse = (result: QueryResult) =>
    result.records.map((record) => {
        const x = record.get('x');
        const y = record.has('y') ? record.get('y') : null;
        const coordinateSystem = record.has('coordinateSystem') ? record.get('coordinateSystem') : null;

        return { x, y, coordinateSystem };
    });

export const normalizeResponseTemplatesCount = (result: QueryResult): { templateId: string; count: number }[] => {
    return result.records.map((record) => ({
        templateId: record.get('templateId'),
        count: +record.get('count'),
        entitiesWithFiles: (record.has('entitiesWithFiles') && record.get('entitiesWithFiles')) ?? undefined,
    }));
};

export const normalizeRuleResultOnEntity = (result: QueryResult) => {
    return result.records[0].toObject() as { value: boolean; formulaCauses: IFormulaCauses };
};

export const normalizeRuleResultsOnEntitiesOfTemplate = (result: QueryResult) => {
    return result.records.map((ruleResult) => ruleResult.toObject() as { entityId: string; value: boolean; formulaCauses: IFormulaCauses });
};

export const normalizeReturnedRelationship =
    <T extends ResponseType>(response: T) =>
    (result: QueryResult): Response<T, IRelationship> => {
        const relationships = result.records.map((record) => {
            const { type, properties } = record.get('r') as Relationship;
            const { properties: sourceEntityProps } = record.get('s') as Node;
            const { properties: destEntityProps } = record.get('d') as Node;

            return {
                templateId: type,
                properties: normalizeFields(properties).properties,
                sourceEntityId: sourceEntityProps._id,
                destinationEntityId: destEntityProps._id,
            };
        });

        if (['singleResponse', 'singleResponseNotNullable'].includes(response))
            return (relationships.length ? relationships[0] : null) as Response<T, IRelationship>;

        return relationships as Response<T, IRelationship>;
    };

export const normalizeReturnedDeletedRelationship = (result: QueryResult) => {
    if (!result.records.length) return null;

    const relationshipResult = result.records[0];

    const relationshipProperties = relationshipResult.get('rProps') as Relationship['properties'];
    const relationshipType = relationshipResult.get('rType') as Relationship['type'];
    const { properties: sourceEntityProps } = relationshipResult.get('s') as Node;
    const { properties: destEntityProps } = relationshipResult.get('d') as Node;

    return {
        templateId: relationshipType,
        properties: normalizeFields(relationshipProperties).properties,
        sourceEntityId: sourceEntityProps._id,
        destinationEntityId: destEntityProps._id,
    };
};

export const normalizeReturnedRelAndEntities =
    () =>
    (result: QueryResult): IEntityExpanded | null => {
        if (!result.records.length) return null;

        const entity = result.records[0].get(0)[0];

        if (!entity) return null;

        const connections = result.records.slice(1).map((record) => {
            const [firstEntity, relationship, secondEntity] = record.get(0).slice(-3) as [Node, Relationship, Node];
            const [sourceEntity, destinationEntity] =
                firstEntity.identity === relationship.start ? [firstEntity, secondEntity] : [secondEntity, firstEntity];

            return {
                sourceEntity: nodeToEntity(sourceEntity),
                relationship: {
                    templateId: relationship.type,
                    properties: normalizeFields(relationship.properties).properties,
                },
                destinationEntity: nodeToEntity(destinationEntity),
            };
        });

        return {
            entity: nodeToEntity(entity),
            connections,
        };
    };

export const normalizeTree =
    () =>
    (result: QueryResult): IEntityTreeNode | null => {
        if (!result.records.length) return null;

        const rootNode = result.records[0].get('elementsOfPath')[0];
        if (!rootNode) return null;

        const modifiedRoot = nodeToEntity(rootNode);
        const relationshipMap = new Map<string, Array<{ child: IEntity; uniqueRelationShipId: string; relationshipId: string }>>();

        result.records.forEach((record) => {
            const elements = record.get('elementsOfPath');
            for (let i = 0; i < elements.length - 1; i += 2) {
                const sourceNode = elements[i];
                const rel = elements[i + 1];
                const destNode = elements[i + 2];

                if (!sourceNode || !rel || !destNode) continue;

                const sourceId = sourceNode.properties._id;
                const relId = rel.properties._id;

                if (!relationshipMap.has(sourceId)) relationshipMap.set(sourceId, []);

                // Avoid duplicates
                const existing = relationshipMap.get(sourceId)!;
                if (!existing.some((item) => item.uniqueRelationShipId === relId)) {
                    existing.push({
                        child: nodeToEntity(destNode),
                        uniqueRelationShipId: relId,
                        relationshipId: rel.type,
                    });
                }
            }
        });

        const buildTree = (node: IEntity, visitedTemplatesIds: Set<string> = new Set()): IEntityTreeNode => {
            const templateId = String(node.templateId);
            const hasSeenTemplate = visitedTemplatesIds.has(templateId);

            const nextVisited = new Set(visitedTemplatesIds);
            nextVisited.add(templateId);

            const children = relationshipMap.get(node.properties._id) || [];

            if (hasSeenTemplate)
                return {
                    ...node,
                    children: [],
                };

            return {
                ...node,
                children: children.map(({ child, relationshipId }) => ({
                    ...buildTree(child, nextVisited),
                    relationshipId,
                })),
            };
        };

        return buildTree(modifiedRoot);
    };

// TODO: clean function
const buildRelationshipTree = (
    paths: string[][],
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    relationShipsMap: Map<string, IMongoRelationshipTemplate>,
): IRelationShipTreeNode[] => {
    const roots: ITreeNodeMap = new Map();

    const insert = (map: ITreeNodeMap, [head, ...tail]: string[], prevId?: string) => {
        if (!head) return;

        const id = head.split('&')[0];

        if (id === prevId) return;
        if (!map.has(id)) {
            map.set(id, { _id: head, children: new Map() });
        }

        insert(map.get(id)!.children, tail, id);
    };

    for (const path of paths) insert(roots, path);

    const finalize = (
        map: ITreeNodeMap,
        depth = 0,
        parentId = '',
        ancestorEntityIds: Set<string> = new Set(),
        remainingCycleLevels = 1,
    ): IRelationShipTreeNode[] =>
        [...map.values()].flatMap((n) => {
            const relationshipFromMongo = relationShipsMap.get(n._id.split('&')[0]);
            if (!relationshipFromMongo) return [];

            const sourceEntity = entityTemplatesMap.get(relationshipFromMongo.sourceEntityId);
            const destinationEntity = entityTemplatesMap.get(relationshipFromMongo.destinationEntityId);
            if (!sourceEntity || !destinationEntity) return [];

            const hasCycleByEntity = ancestorEntityIds.has(sourceEntity._id) || ancestorEntityIds.has(destinationEntity._id);

            const nextAncestorIds = new Set(ancestorEntityIds);
            nextAncestorIds.add(sourceEntity._id);
            nextAncestorIds.add(destinationEntity._id);

            const shouldCutHere = hasCycleByEntity && remainingCycleLevels <= 0;

            const nextRemainingCycleLevels = hasCycleByEntity ? remainingCycleLevels - 1 : remainingCycleLevels;

            return {
                ...relationshipFromMongo,
                mongoAndRelId: n._id,
                sourceEntity,
                destinationEntity,
                depth,
                parentId,
                children: shouldCutHere ? [] : finalize(n.children, depth + 1, n._id, nextAncestorIds, nextRemainingCycleLevels),
            };
        });

    return finalize(roots);
};

export const buildTemplateTree =
    (entityTemplatesMap: Map<string, IMongoEntityTemplate>, relationShipsMap: Map<string, IMongoRelationshipTemplate>) =>
    (result: QueryResult): any => {
        if (!result.records.length) return null;

        const relationships: string[][] = result.records.map((key) => key.get('relationshipIds'));

        return buildRelationshipTree(relationships, entityTemplatesMap, relationShipsMap);
    };

const formatUndirectedRelationship = (relationship: Relationship, node1: Node, node2: Node): IRelationship => {
    const [sourceNode, destinationNode] = relationship.start === node1.identity ? [node1, node2] : [node2, node1];

    return {
        templateId: relationship.type,
        properties: normalizeFields(relationship.properties).properties,
        sourceEntityId: sourceNode.properties._id,
        destinationEntityId: destinationNode.properties._id,
    };
};

export const normalizeSearchWithRelationships = (result: QueryResult): IEntityWithDirectRelationships[] => {
    return result.records.map((record): IEntityWithDirectRelationships => {
        const { node, relationships } = record.toObject() as {
            node: Node;
            relationships: Array<{ relationship: Relationship; otherEntity: Node }> | null;
        };
        return {
            entity: nodeToEntity(node),
            relationships: relationships?.map(({ relationship, otherEntity }) => ({
                relationship: formatUndirectedRelationship(relationship, node, otherEntity),
                otherEntity: nodeToEntity(otherEntity),
            })),
        };
    });
};

export const normalizeNeighborsOfEntityForRule = (result: QueryResult) => {
    return result.records.map((record) => {
        const relationshipTemplate = record.get('rTemplate') as string;
        const neighborOfEntity = record.get('neighbor') as Node;

        return {
            relationshipTemplate,
            neighborOfEntity: nodeToEntity(neighborOfEntity),
        };
    });
};

export const normalizeGetDbConstraints = (constraintsQueryResult: QueryResult) => {
    const constraints = constraintsQueryResult.records.map((constraint) => constraint.toObject());
    return constraints as Array<{ name: string; description: string }>;
};

export const runInTransactionAndNormalize = async <T>(
    transaction: Transaction,
    cypherQuery: string,
    normalizeFunction: (queryResult: QueryResult) => T,
    parameters?: Record<string, any>,
): Promise<T> => {
    const result = await transaction.run(cypherQuery, parameters);

    return normalizeFunction(result);
};

export const getNeo4jDateTime = (date = new Date()) => {
    /*
    keep date in DB in israel timezone. it's needed in rules formula "toDate" function to get date of datetime field, but in israel.
    for example, if event happened at 01:00, UTC will save it the day before, so "toDate" will bring the wrong date.
    */
    const adjustedDate = toZonedTime(date, timezone);
    return neo4j.types.LocalDateTime.fromStandardDate(adjustedDate);
};
export const getNeo4jDate = (date = new Date()) => neo4j.types.Date.fromStandardDate(date);

export const generateDefaultProperties = () => {
    const timestamp = getNeo4jDateTime();
    const id = uuidv4();

    return {
        _id: id,
        createdAt: timestamp,
        updatedAt: timestamp,
        disabled: false,
    };
};

const getLocationPoint = (pointString: string, splitBy: SplitBy, entityProperties: Record<string, any>, key: string) => {
    const [longitude, latitude] = pointString.split(splitBy).map(Number);
    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
        throw new ValidationError('Invalid format. Expected format: "number, number".', {
            properties: entityProperties,
            errors: [
                {
                    type: ActionErrors.validation,
                    metadata: {
                        message: 'must be location, Invalid format. Expected format: "number, number".',
                        path: `/${key}`,
                        schemaPath: `#/properties/${key}/format`,
                        params: { type: 'string', format: 'location' },
                    },
                },
            ],
        });
    }

    return new neo4j.types.Point(srid, longitude, latitude);
};

export const getNeo4jLocation = (locationString: string, entityProperties: Record<string, any>, key: string) => {
    if (!locationString.startsWith('POLYGON')) return getLocationPoint(locationString, SplitBy.comma, entityProperties, key);

    if (!locationString.startsWith(polygonPrefix) || !locationString.endsWith(polygonSuffix)) {
        throw new ValidationError('Invalid format. Expected format: "number, number".', {
            properties: entityProperties,
            errors: [
                {
                    type: ActionErrors.validation,
                    metadata: {
                        message: 'must be location, Invalid format. Expected polygon format: POLYGON((number number, number number, ...))',
                        path: `/${key}`,
                        schemaPath: `#/properties/${key}/format`,
                        params: { type: 'string', format: 'location' },
                    },
                },
            ],
        });
    }

    const coordsStr = locationString.slice(polygonPrefix.length, -polygonSuffix.length);

    return coordsStr.split(SplitBy.comma).map((stringedLocation: string) => getLocationPoint(stringedLocation, SplitBy.space, entityProperties, key));
};
