import { v4 as uuidv4 } from 'uuid';
import neo4j, { QueryResult } from 'neo4j-driver';

const normalizeDateFields = (properties: object) => {
    const props = {};

    Object.entries(properties).forEach(([key, value]) => {
        props[key] = value instanceof neo4j.types.DateTime ? new Date(value.toString()) : value;
    });

    return props;
};

type ResponseType = 'singleResponse' | 'multipleResponses';

export const normalizeReturnedEntity =
    (response: ResponseType = 'singleResponse') =>
    (result: QueryResult) => {
        const entities = result.records.map((record) => {
            const { labels, properties } = record.get(0);

            return {
                templateId: labels[0],
                properties: normalizeDateFields(properties),
            };
        });

        if (response === 'singleResponse') {
            return entities.length > 0 ? entities[0] : null;
        }

        return entities;
    };

export const normalizeReturnedEntitiesCount = (result: QueryResult) => {
    return result.records[0].get(0).toNumber();
};

export const normalizeReturnedRelationship = (result: QueryResult) => {
    if (!result.records.length) {
        return null;
    }

    const relationshipRecord = result.records[0];
    const { type, properties } = relationshipRecord.get(0);

    return {
        templateId: type,
        properties: normalizeDateFields(properties),
    };
};

export const normalizeReturnedRelAndEntities = (result: QueryResult) => {
    if (!result.records.length) {
        return null;
    }

    const entity = result.records[0].get('n');

    if (!entity) {
        return null;
    }

    const connections = result.records.map((record) => {
        const relationship = record.get('r');
        const entityInstance = record.get('m');

        if (!relationship && !entityInstance) {
            return null;
        }

        return {
            relationship: {
                templateId: relationship.type,
                properties: normalizeDateFields(relationship.properties),
            },
            entity: {
                templateId: entityInstance.labels[0],
                properties: normalizeDateFields(entityInstance.properties),
            },
        };
    });

    return {
        entity: {
            templateId: entity.labels[0],
            properties: normalizeDateFields(entity.properties),
        },
        connections: connections.filter(Boolean),
    };
};

export const getNeo4jDate = () => neo4j.types.DateTime.fromStandardDate(new Date());

export const generateDefaultProperties = () => {
    const timestamp = getNeo4jDate();
    const id = uuidv4();

    return {
        _id: id,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
};
