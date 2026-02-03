import {
    ActionErrors,
    IEntity,
    IEntityExpanded,
    IEntityWithDirectRelationships,
    IKartoffelUser,
    IMongoEntityTemplate,
    IPropertyValue,
    IRelationship,
    PropertyFormat,
    SplitBy,
    ValidationError,
} from '@microservices/shared';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import neo4j, { Node as Neo4jNode, Relationship as Neo4jRelationship, QueryResult, Transaction } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import EntityManager from '../../express/entities/manager';
import { IFormulaCauses } from '../../express/rules/interfaces/formulaWithCauses';
import Kartoffel from '../../externalServices/kartoffel';
import EntityTemplateService from '../../externalServices/templates/entityTemplateManager';

const {
    map: {
        polygon: { polygonPrefix, polygonSuffix },
        srid,
    },
    timezone,
    neo4j: { stringPropertySuffix, colorPropertySuffix, booleanPropertySuffix, filePropertySuffix, locationCoordinateSystemSuffix },
} = config;

export type Node = Neo4jNode<number>;
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
export const normalizeFields = async (
    properties: Record<string, IPropertyValue>,
    template?: IMongoEntityTemplate,
    isGetMode?: boolean,
): Promise<{ properties: Record<string, IPropertyValue>; coloredFields: Record<string, string> }> => {
    const props = {};
    const coloredFields = {};

    // const usersArrayKeys: Set<string> = new Set<string>();
    const userKeys: Set<string> = new Set();

    for (const [key, value] of Object.entries(properties)) {
        const suffixes = [stringPropertySuffix, booleanPropertySuffix, filePropertySuffix, locationCoordinateSystemSuffix];

        if (suffixes.some((suffix) => key.endsWith(suffix))) continue;

        if (key.endsWith(colorPropertySuffix) && properties[key] !== undefined) coloredFields[key.slice(0, -colorPropertySuffix.length)] = value;

        if (template && isGetMode) {
            // it's entity and not relationship
            if (template.properties.properties[key]?.format === PropertyFormat.user) {
                userKeys.add(value);
            }

            if (template.properties.properties[key]?.items?.format === PropertyFormat.user) {
                value.forEach((kartoffelId: string) => {
                    userKeys.add(kartoffelId);
                });
            }
        }

        if (value instanceof neo4j.types.LocalDateTime) {
            props[key] = fromZonedTime(new Date(value.toString()), timezone).toISOString();
            continue;
        }

        if (value instanceof neo4j.types.Date) {
            props[key] = formatDate(value.toString());
            continue;
        }

        if (value instanceof neo4j.types.Point) {
            props[key] = { location: `${value.x}, ${value.y}`, coordinateSystem: properties[`${key}${locationCoordinateSystemSuffix}`] };
            continue;
        }
        if (Array.isArray(value) && value.every((item) => item instanceof neo4j.types.Point)) {
            const points = value.map((point) => `${point.x} ${point.y}`);
            props[key] = {
                location: `${polygonPrefix}${points.join(',')}${polygonSuffix}`,
                coordinateSystem: properties[`${key}${locationCoordinateSystemSuffix}`],
            };

            continue;
        }

        props[key] = value;
    }

    const transformUser = (foundUser: IKartoffelUser) => ({
        _id: foundUser._id || foundUser.id,
        fullName: foundUser.fullName,
        jobTitle: foundUser.jobTitle,
        hierarchy: foundUser.hierarchy,
        mail: foundUser.mail,
        userType: foundUser.entityType,
    });

    if (userKeys.size && template) {
        const users = await Kartoffel.getUsersByIds(Array.from(userKeys.keys()));

        for (const [key, value] of Object.entries(properties)) {
            const property = template.properties.properties[key];
            if (property?.format === PropertyFormat.user) {
                const foundUser = users.find(({ _id }) => _id === value);
                if (!foundUser) props[key] = undefined;
                else {
                    props[key] = transformUser(foundUser);

                    const kartoffelUserFieldObj = Object.entries(template.properties.properties).reduce(
                        (acc, [kartoffelKey, prop]) => {
                            if (prop.format === PropertyFormat.kartoffelUserField && prop.expandedUserField?.relatedUserField === key)
                                acc[kartoffelKey] = prop;
                            return acc;
                        },
                        {} as Record<string, IPropertyValue>,
                    );

                    Object.entries(kartoffelUserFieldObj).forEach(([kartoffelKey, kartoffelProp]) => {
                        props[kartoffelKey] = foundUser[kartoffelProp?.expandedUserField?.kartoffelField || ''];
                    });
                }
            }

            if (property?.items?.format === PropertyFormat.user) {
                const foundUsers = users.filter(({ _id }) => value.includes(_id));
                props[key] = foundUsers.map((foundUser) => transformUser(foundUser));
            }
        }
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

export const nodeToEntity = async (node: Node, template: IMongoEntityTemplate, isGetMode?: boolean): Promise<IEntity> => {
    const { properties, coloredFields } = await normalizeFields(node.properties, template, isGetMode);
    return {
        templateId: node.labels[0],
        properties: EntityManager.fixReturnedEntityReferencesFields(properties),
        coloredFields,
    };
};

type IFunctionTemplate = { type: 'function'; metadata: string }; // string metadata is workspace id
type IPureTemplate = { type: 'pure'; metadata: IMongoEntityTemplate };
type ITemplate = IFunctionTemplate | IPureTemplate;

export const normalizeReturnedEntity =
    <T extends ResponseType>(response: T, template: ITemplate, isGetMode: boolean = true) =>
    async (result: QueryResult): Promise<Response<T, IEntity>> => {
        const entities = await Promise.all(
            result.records.map(async (record) => {
                const templateId = record.get(0).labels[0];
                const entityTemplate =
                    template.type === 'pure'
                        ? template.metadata
                        : await new EntityTemplateService(template.metadata).getEntityTemplateById(templateId);

                return nodeToEntity(record.get(0) as Node, entityTemplate, isGetMode);
            }),
        );

        if (['singleResponse', 'singleResponseNotNullable'].includes(response))
            return (entities.length > 0 ? entities[0] : null) as Response<T, IEntity>;

        return entities as Response<T, IEntity>;
    };

export const normalizeSearchByLocationResponse = async (
    result: QueryResult,
    workspaceId: string,
): Promise<Array<{ node: IEntity; matchingFields: string[] }>> => {
    const entityTemplateService = new EntityTemplateService(workspaceId);

    return Promise.all(
        result.records.map(async (record) => {
            const node = record.get(0) as Node;
            const template = await entityTemplateService.getEntityTemplateById(node.labels[0]);

            return {
                node: await nodeToEntity(node, template),
                matchingFields: record.get(1) as string[],
            };
        }),
    );
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
    async (result: QueryResult): Promise<Response<T, IRelationship>> => {
        const relationships = await Promise.all(
            result.records.map(async (record) => {
                const { type, properties } = record.get('r') as Relationship;
                const { properties: sourceEntityProps } = record.get('s') as Node;
                const { properties: destEntityProps } = record.get('d') as Node;

                const normalized = await normalizeFields(properties);

                return {
                    templateId: type,
                    properties: normalized.properties,
                    sourceEntityId: sourceEntityProps._id,
                    destinationEntityId: destEntityProps._id,
                };
            }),
        );

        if (['singleResponse', 'singleResponseNotNullable'].includes(response))
            return (relationships.length > 0 ? relationships[0] : null) as Response<T, IRelationship>;

        return relationships as Response<T, IRelationship>;
    };

export const normalizeReturnedDeletedRelationship = async (result: QueryResult) => {
    if (!result.records.length) return null;

    const relationshipResult = result.records[0];

    const relationshipProperties = relationshipResult.get('rProps') as Relationship['properties'];
    const relationshipType = relationshipResult.get('rType') as Relationship['type'];
    const { properties: sourceEntityProps } = relationshipResult.get('s') as Node;
    const { properties: destEntityProps } = relationshipResult.get('d') as Node;

    return {
        templateId: relationshipType,
        properties: (await normalizeFields(relationshipProperties)).properties,
        sourceEntityId: sourceEntityProps._id,
        destinationEntityId: destEntityProps._id,
    };
};

export const normalizeReturnedRelAndEntities =
    (workspaceId: string) =>
    async (result: QueryResult): Promise<IEntityExpanded | null> => {
        if (!result.records.length) return null;

        const entity = result.records[0].get(0)[0];

        if (!entity) return null;
        const entityTemplateService = new EntityTemplateService(workspaceId);

        const connections = await Promise.all(
            result.records.slice(1).map(async (record) => {
                const [firstEntity, relationship, secondEntity] = record.get(0).slice(-3) as [Node, Relationship, Node];

                const [sourceNode, destinationNode] =
                    firstEntity.identity === relationship.start ? [firstEntity, secondEntity] : [secondEntity, firstEntity];

                const [sourceTemplate, destinationTemplate] = await Promise.all([
                    entityTemplateService.getEntityTemplateById(sourceNode.labels[0]),
                    entityTemplateService.getEntityTemplateById(destinationNode.labels[0]),
                ]);

                return {
                    sourceEntity: await nodeToEntity(sourceNode, sourceTemplate, true),
                    relationship: {
                        templateId: relationship.type,
                        properties: (await normalizeFields(relationship.properties)).properties,
                    },
                    destinationEntity: await nodeToEntity(destinationNode, destinationTemplate, true),
                };
            }),
        );
        const template = await entityTemplateService.getEntityTemplateById(entity.labels[0]);

        return {
            entity: await nodeToEntity(entity, template, true),
            connections,
        };
    };

const formatUndirectedRelationship = async (relationship: Relationship, node1: Node, node2: Node): Promise<IRelationship> => {
    const [sourceNode, destinationNode] = relationship.start === node1.identity ? [node1, node2] : [node2, node1];

    return {
        templateId: relationship.type,
        properties: (await normalizeFields(relationship.properties)).properties,
        sourceEntityId: sourceNode.properties._id,
        destinationEntityId: destinationNode.properties._id,
    };
};

export const normalizeSearchWithRelationships = async (result: QueryResult, workspaceId: string): Promise<IEntityWithDirectRelationships[]> => {
    const entityTemplateService = new EntityTemplateService(workspaceId);
    return Promise.all(
        result.records.map(async (record): Promise<IEntityWithDirectRelationships> => {
            const { node, relationships } = record.toObject() as {
                node: Node;
                relationships: Array<{ relationship: Relationship; otherEntity: Node }> | null;
            };

            const normalizedRelationships = await Promise.all(
                (relationships ?? []).map(async ({ relationship, otherEntity }) => ({
                    relationship: await formatUndirectedRelationship(relationship, node, otherEntity),
                    otherEntity: await nodeToEntity(otherEntity, await entityTemplateService.getEntityTemplateById(otherEntity.labels[0])),
                })),
            );
            return {
                entity: await nodeToEntity(node, await entityTemplateService.getEntityTemplateById(node.labels[0]), true),
                relationships: normalizedRelationships,
            };
        }),
    );
};

export const normalizeNeighborsOfEntityForRule = async (result: QueryResult, workspaceId: string) => {
    const entityTemplateService = new EntityTemplateService(workspaceId);

    return Promise.all(
        result.records.map(async (record) => {
            const relationshipTemplate = record.get('rTemplate') as string;
            const neighborOfEntity = record.get('neighbor') as Node;

            return {
                relationshipTemplate,
                neighborOfEntity: await nodeToEntity(neighborOfEntity, await entityTemplateService.getEntityTemplateById(neighborOfEntity.labels[0])),
            };
        }),
    );
};

export const normalizeGetDbConstraints = (constraintsQueryResult: QueryResult) => {
    const constraints = constraintsQueryResult.records.map((constraint) => constraint.toObject());
    return constraints as Array<{ name: string; description: string }>;
};

export const runInTransactionAndNormalize = async <T>(
    transaction: Transaction,
    cypherQuery: string,
    normalizeFunction: (queryResult: QueryResult) => T,
    // biome-ignore lint/suspicious/noExplicitAny: never doubt Noam
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

const getLocationPoint = (pointString: string, splitBy: SplitBy, entityProperties: Record<string, IPropertyValue>, key: string) => {
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

export const getNeo4jLocation = (locationString: string, entityProperties: Record<string, IPropertyValue>, key: string) => {
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
