import { v4 as uuidv4 } from 'uuid';
import neo4j, { QueryResult, Node, Relationship } from 'neo4j-driver';
import config from '../../config';

/**
 *
 * @param date
 * @returns Date in YYYY-MM-DD Format
 */
export const formatDate = (date: string) => {
    return date.slice(0, 10);
};

const normalizeFields = (properties: Record<string, any>) => {
    const props = {};

    Object.entries(properties).forEach(([key, value]) => {
        if (key.endsWith(config.neo4j.stringPropertySuffix)) {
            return;
        }

        if (value instanceof neo4j.types.DateTime) {
            props[key] = new Date(value.toString());

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

type ResponseType = 'singleResponse' | 'multipleResponses';

export const normalizeReturnedEntity =
    (response: ResponseType = 'singleResponse') =>
    (result: QueryResult) => {
        const entities = result.records.map((record) => {
            const { labels, properties } = record.get(0);

            return {
                templateId: labels[0],
                properties: normalizeFields(properties),
            };
        });

        if (response === 'singleResponse') {
            return entities.length > 0 ? entities[0] : null;
        }

        return entities;
    };

export const normalizeResponseCount = (result: QueryResult) => {
    return result.records[0].get(0).toNumber();
};

export const normalizeReturnedRelationship =
    (response: ResponseType = 'singleResponse') =>
    (result: QueryResult) => {
        const relationships = result.records.map((record) => {
            const { type, properties } = record.get('r');
            const { properties: sourceEntityProps } = record.get('s');
            const { properties: destEntityProps } = record.get('d');

            return {
                templateId: type,
                properties: normalizeFields(properties),
                sourceEntityId: sourceEntityProps._id,
                destinationEntityId: destEntityProps._id,
            };
        });

        if (response === 'singleResponse') {
            return relationships.length > 0 ? relationships[0] : null;
        }

        return relationships;
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
