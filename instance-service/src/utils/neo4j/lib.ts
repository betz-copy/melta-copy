import { v4 as uuidv4 } from 'uuid';
import neo4j, { QueryResult, Node as Neo4jNode, Relationship as Neo4jRelationship, Transaction } from 'neo4j-driver';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { IEntity, IEntityExpanded, IEntityWithDirectRelationships } from '../../express/entities/interface';
import { IRelationship } from '../../express/relationships/interface';
import config from '../../config';
import EntityManager from '../../express/entities/manager';
import { IFormulaCauses } from '../../express/rules/interfaces/formulaWithCauses';

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

const normalizeFields = (properties: Record<string, any>): Record<string, any> => {
    const props = {};

    Object.entries(properties).forEach(([key, value]) => {
        if (key.endsWith(config.neo4j.stringPropertySuffix)) {
            return;
        }

        if (value instanceof neo4j.types.LocalDateTime) {
            props[key] = zonedTimeToUtc(new Date(value.toString()), 'Asia/Jerusalem').toISOString();

            return;
        }

        if (value instanceof neo4j.types.Date) {
            props[key] = formatDate(value.toString());

            return;
        }

        props[key] = value;
    });

    return props;
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
    const entity = {
        templateId: node.labels[0],
        properties: normalizeFields(node.properties),
    };

    return EntityManager.fixReturnedEntityRefrencesFields(entity);
};

export const normalizeReturnedEntity =
    <T extends ResponseType>(response: T) =>
    (result: QueryResult): Response<T, IEntity> => {
        const entities = result.records.map((record) => nodeToEntity(record.get(0) as Node));

        if (response === 'singleResponse' || response === 'singleResponseNotNullable') {
            return (entities.length > 0 ? entities[0] : null) as Response<T, IEntity>;
        }

        return entities as Response<T, IEntity>;
    };

export const normalizeResponseCount = (result: QueryResult): number => {
    return result.records[0].get(0);
};

export const normalizeRuleResult = (result: QueryResult) => {
    return result.records[0].toObject() as { value: boolean; formulaCauses: IFormulaCauses };
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
                properties: normalizeFields(properties),
                sourceEntityId: sourceEntityProps._id,
                destinationEntityId: destEntityProps._id,
            };
        });

        if (response === 'singleResponse' || response === 'singleResponseNotNullable') {
            return (relationships.length > 0 ? relationships[0] : null) as Response<T, IRelationship>;
        }

        return relationships as Response<T, IRelationship>;
    };

export const normalizeReturnedDeletedRelationship = (result: QueryResult) => {
    if (result.records.length === 0) {
        return null;
    }

    const relationshipResult = result.records[0];

    const relationshipProperties = relationshipResult.get('rProps') as Relationship['properties'];
    const relationshipType = relationshipResult.get('rType') as Relationship['type'];
    const { properties: sourceEntityProps } = relationshipResult.get('s') as Node;
    const { properties: destEntityProps } = relationshipResult.get('d') as Node;

    return {
        templateId: relationshipType,
        properties: normalizeFields(relationshipProperties),
        sourceEntityId: sourceEntityProps._id,
        destinationEntityId: destEntityProps._id,
    };
};

const doesPathContainDisabledNode = (path: (Node | Relationship)[], disabled: boolean) => {
    return path.slice(1).some((pathPart) => {
        const isNode = 'labels' in pathPart;
        return isNode && !pathPart.properties.disabled === disabled;
    });
};

export const normalizeReturnedRelAndEntities =
    (disabled: boolean | null) =>
    (result: QueryResult): IEntityExpanded | null => {
        if (!result.records.length) {
            return null;
        }

        const entity = result.records[0].get(0)[0];

        if (!entity) {
            return null;
        }

        const validConnections = result.records.slice(1).filter((record) => {
            const path = record.get(0) as (Node | Relationship)[];

            if (typeof disabled === 'boolean') {
                return !doesPathContainDisabledNode(path, disabled);
            }

            return true;
        });

        const connections = validConnections.map((record) => {
            const [firstEntity, relationship, secondEntity] = record.get(0).slice(-3) as [Node, Relationship, Node];
            const [sourceEntity, destinationEntity] =
                relationship.start === firstEntity.identity ? [firstEntity, secondEntity] : [secondEntity, firstEntity];

            return {
                sourceEntity: nodeToEntity(sourceEntity),
                relationship: {
                    templateId: relationship.type,
                    properties: normalizeFields(relationship.properties),
                },
                destinationEntity: nodeToEntity(destinationEntity),
            };
        });

        return {
            entity: nodeToEntity(entity),
            connections,
        };
    };

const formatUndirectedRelationship = (relationship: Relationship, node1: Node, node2: Node): IRelationship => {
    const [sourceNode, destinationNode] = relationship.start === node1.identity ? [node1, node2] : [node2, node1];

    return {
        templateId: relationship.type,
        properties: normalizeFields(relationship.properties),
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

export const normalizeNeighboursOfEntityForRule = (result: QueryResult) => {
    return result.records.map((record) => {
        const relationshipTemplate = record.get('rTemplate') as string;
        const neighbourOfEntity = record.get('neighbour') as Node;

        return {
            relationshipTemplate,
            neighbourOfEntity: nodeToEntity(neighbourOfEntity),
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
    const adjustedDate = utcToZonedTime(date, 'Asia/Jerusalem');
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
