import { v4 as uuidv4 } from 'uuid';
import neo4j, { QueryResult, Node, Relationship, Transaction } from 'neo4j-driver';
import { IEntity } from '../../express/entities/interface';
import { IRelationship } from '../../express/relationships/interface';
import config from '../../config';
import { IConnection } from '../../express/rules/interfaces';

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

        if (value instanceof neo4j.types.DateTime) {
            props[key] = new Date(value.toString()).toISOString();

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

export const normalizeReturnedEntity =
    <T extends ResponseType>(response: T) =>
    (result: QueryResult): Response<T, IEntity> => {
        const entities = result.records.map((record) => {
            const { labels, properties } = record.get(0) as Node;

            return {
                templateId: labels[0],
                properties: normalizeFields(properties),
            };
        });

        if (response === 'singleResponse' || response === 'singleResponseNotNullable') {
            return (entities.length > 0 ? entities[0] : null) as Response<T, IEntity>;
        }

        return entities as Response<T, IEntity>;
    };

export const normalizeResponseCount = (result: QueryResult): number => {
    return result.records[0].get(0).toNumber();
};

export const normalizeRuleResultAgainstPair = (result: QueryResult): boolean => {
    return result.records[0].get('doesRuleStillApply');
};

export const normalizeRuleResultsAgainstPinnedEntity = (result: QueryResult) => {
    return result.records.map((resultOfPairRecord) => {
        const resultOfPair = resultOfPairRecord.toObject();
        return resultOfPair as { unpinnedRelationshipId: string; unpinnedEntityId: string; doesRuleStillApply: boolean };
    });
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

export const normalizeReturnedRelAndEntities = (disabled: boolean | null) => (result: QueryResult) => {
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
        const [sourceEntity, destinationEntity] = relationship.start.equals(firstEntity.identity)
            ? [firstEntity, secondEntity]
            : [secondEntity, firstEntity];

        return {
            sourceEntity: {
                templateId: sourceEntity.labels[0],
                properties: normalizeFields(sourceEntity.properties),
            },
            relationship: {
                templateId: relationship.type,
                properties: normalizeFields(relationship.properties),
            },
            destinationEntity: {
                templateId: destinationEntity.labels[0],
                properties: normalizeFields(destinationEntity.properties),
            },
        };
    });

    return {
        entity: {
            templateId: entity.labels[0],
            properties: normalizeFields(entity.properties),
        },
        connections,
    };
};

export const normalizeRelAndEntitiesForRule = (result: QueryResult): IConnection[] => {
    return result.records.map((record) => {
        const sourceEntity = record.get('s') as Node;
        const relationship = record.get('r') as Relationship;
        const destinationEntity = record.get('d') as Node;

        return {
            sourceEntity: {
                templateId: sourceEntity.labels[0],
                properties: normalizeFields(sourceEntity.properties),
            },
            relationship: {
                templateId: relationship.type,
                properties: normalizeFields(relationship.properties),
                sourceEntityId: sourceEntity.properties._id,
                destinationEntityId: destinationEntity.properties._id,
            },
            destinationEntity: {
                templateId: destinationEntity.labels[0],
                properties: normalizeFields(destinationEntity.properties),
            },
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

export const getNeo4jDateTime = (date = new Date()) => neo4j.types.DateTime.fromStandardDate(date);
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
