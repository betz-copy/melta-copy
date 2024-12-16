import { v4 as uuidv4 } from 'uuid';
import neo4j, { QueryResult, Node as Neo4jNode, Relationship as Neo4jRelationship, Transaction } from 'neo4j-driver';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { IEntity, IEntityExpanded, IEntityWithDirectRelationships } from '../../express/entities/interface';
import { IRelationship } from '../../express/relationships/interfaces';
import config from '../../config';
import { EntityManager } from '../../express/entities/manager';
import { IFormulaCauses } from '../../express/rules/interfaces/formulaWithCauses';
import { userFieldSuffix, usersFieldsSuffix } from '../../express/entities/validator.template';
import { ISemanticSearchResult } from '../../externalServices/semanticSearch/interface';

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

    const usersArrayKeys: Set<string> = new Set<string>();
    const userKeys: Set<string> = new Set<string>();

    Object.entries(properties).forEach(([key, value]) => {
        if (
            key.endsWith(config.neo4j.stringPropertySuffix) ||
            key.endsWith(config.neo4j.booleanPropertySuffix) ||
            key.endsWith(config.neo4j.filePropertySuffix)
        ) {
            return;
        }

        if (key.includes('.') && key.endsWith(`${config.neo4j.usersFieldsPropertySuffix}`)) {
            usersArrayKeys.add(key.split('.')[0]);
            return;
        }

        if (key.includes('.') && key.endsWith(`${config.neo4j.userFieldPropertySuffix}`)) {
            userKeys.add(key.split('.')[0]);
            return;
        }

        if (value instanceof neo4j.types.LocalDateTime) {
            props[key] = fromZonedTime(new Date(value.toString()), 'Asia/Jerusalem').toISOString();

            return;
        }

        if (value instanceof neo4j.types.Date) {
            props[key] = formatDate(value.toString());

            return;
        }

        props[key] = value;
    });

    if (usersArrayKeys.size) {
        usersArrayKeys.forEach((userKey) => {
            props[userKey] = properties[`${userKey}${usersFieldsSuffix.ids}${config.neo4j.usersFieldsPropertySuffix}`].map((id, index) => {
                return JSON.stringify({
                    _id: id,
                    fullName: properties[`${userKey}${usersFieldsSuffix.fullNames}${config.neo4j.usersFieldsPropertySuffix}`][index],
                    jobTitle: properties[`${userKey}${usersFieldsSuffix.jobTitles}${config.neo4j.usersFieldsPropertySuffix}`][index],
                    hierarchy: properties[`${userKey}${usersFieldsSuffix.hierarchies}${config.neo4j.usersFieldsPropertySuffix}`][index],
                    mail: properties[`${userKey}${usersFieldsSuffix.mails}${config.neo4j.usersFieldsPropertySuffix}`][index],
                });
            });
        });
    }

    if (userKeys.size) {
        userKeys.forEach((userKey) => {
            props[userKey] = JSON.stringify({
                _id: properties[`${userKey}${userFieldSuffix._id}${config.neo4j.userFieldPropertySuffix}`],
                fullName: properties[`${userKey}${userFieldSuffix.fullName}${config.neo4j.userFieldPropertySuffix}`],
                jobTitle: properties[`${userKey}${userFieldSuffix.jobTitle}${config.neo4j.userFieldPropertySuffix}`],
                hierarchy: properties[`${userKey}${userFieldSuffix.hierarchy}${config.neo4j.userFieldPropertySuffix}`],
                mail: properties[`${userKey}${userFieldSuffix.mail}${config.neo4j.userFieldPropertySuffix}`],
            });
        });
    }

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

    return EntityManager.fixReturnedEntityReferencesFields(entity);
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

const formatEntitiesWithFiles = (entitiesWithFiles: ISemanticSearchResult[string]): Record<string, string[]> =>
    Object.entries(entitiesWithFiles).reduce((acc, [entityId, entityData]) => {
        entityData.forEach(({ minioFileId }) => {
            if (!acc[entityId]) acc[entityId] = [];
            acc[entityId].push(minioFileId);
        });
        return acc;
    }, {});

export const normalizeResponseTemplatesCount = (
    result: QueryResult,
): { templateId: string; count: number; entitiesWithFiles?: Record<string, string[]> }[] => {
    // entitiesWithFiles: { entityId: minioFileId[] }
    return result.records.map((record) => {
        const formattedObject: { templateId: string; count: number; entitiesWithFiles?: Record<string, string[]> } = {
            templateId: record.get('templateId'),
            count: +record.get('count'),
        };

        if (record.has('entitiesWithFiles') && record.get('entitiesWithFiles')) {
            formattedObject.entitiesWithFiles = formatEntitiesWithFiles(record.get('entitiesWithFiles') as ISemanticSearchResult[string]);
        }

        return formattedObject;
    });
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
    const adjustedDate = toZonedTime(date, 'Asia/Jerusalem');
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
