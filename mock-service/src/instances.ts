
import { IUniqueConstraintOfTemplate } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IRelationship } from '@packages/relationship';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import axios from 'axios';
import { JSONSchemaFaker } from 'json-schema-faker';
import pLimit from 'p-limit';
import config from './config';
import { trycatch } from './utils';
import createAxiosInstance from './utils/axios';
import { generateRandomLocation, generateRandomPolygon } from './utils/map';

const limit = pLimit(config.requestLimit);

const {
    url,
    createEntityRoute,
    updateConstraintsOfTemplateRoute,
    maxNumberOfEntities,
    minNumberOfEntities,
    createRelationshipRoute,
    maxNumberOfRelationships,
    minNumberOfRelationships,
    isAliveRoute,
} = config.instanceService;

export const createInstances = async (
    workspaceId: string,
    userId: string,
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
    chance: Chance.Chance,
    fileId: string,
    maxEntitiesPerTemplate?: number,
    relationshipReferenceTemplateId?: string,
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    JSONSchemaFaker.format('fileId', (_value) => fileId);

    JSONSchemaFaker.format('location', (_value) => {
        const selectedFunction = chance.pickone([generateRandomLocation, generateRandomPolygon]);
        return selectedFunction();
    });

    JSONSchemaFaker.format('signature', (_value) => 'This is a fake comment');
    JSONSchemaFaker.format('comment', () => 'This is a fake comment');
    JSONSchemaFaker.format('text-area', () => 'Itay hamelech');

    JSONSchemaFaker.format('user', (_value) => {
        return JSON.stringify({
            _id: '5e5688d54203fc40043591ac',
            fullName: 'אחמד אדידס',
            jobTitle: 'טבח',
            hierarchy: 'es_name/es',
            mail: 't25458789sh@jello.com',
        });
    });

    if (relationshipReferenceTemplateId) {
        JSONSchemaFaker.format('relationshipReference', (_value) => relationshipReferenceTemplateId);
    } else {
        JSONSchemaFaker.format('relationshipReference', (_value) => {
            return JSON.stringify({
                _id: '5e5688d54203fc40043591ac',
                fullName: 'אחמד אדידס',
                jobTitle: 'טבח',
                hierarchy: 'es_name/es',
                mail: 't25458789sh@jello.com',
            });
        });
    }

    const promises = entityTemplates.flatMap((entityTemplate) => {
        return Array.from({ length: chance.integer({ min: minNumberOfEntities, max: maxEntitiesPerTemplate || maxNumberOfEntities }) }, () =>
            limit(() => {
                let entityProperties = JSONSchemaFaker.generate(entityTemplate.properties);

                if (entityTemplate.name === 'driver') {
                    while (
                        typeof entityProperties !== 'object' ||
                        entityProperties === null ||
                        Array.isArray(entityProperties) ||
                        !('full_name' in entityProperties)
                    ) {
                        entityProperties = JSONSchemaFaker.generate(entityTemplate.properties);
                    }
                }

                if (entityTemplate.name === 'car') {
                    while (
                        typeof entityProperties !== 'object' ||
                        entityProperties === null ||
                        Array.isArray(entityProperties) ||
                        !('ID' in entityProperties)
                    ) {
                        entityProperties = JSONSchemaFaker.generate(entityTemplate.properties);
                    }
                }

                return axiosInstance.post(url + createEntityRoute, {
                    properties: entityProperties,
                    templateId: entityTemplate._id,
                    userId,
                });
            }),
        );
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};

export const createRelationshipInstances = async (
    workspaceId: string,
    userId: string,
    entities: { properties: { _id: string }; templateId: string }[],
    relationshipTemplates: IMongoRelationshipTemplate[],
    chance: Chance.Chance,
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const promises = relationshipTemplates.flatMap((relationshipTemplate) => {
        const relevantSourceEntities = entities.filter((entity) => entity.templateId === relationshipTemplate.sourceEntityId);
        const relevantDestinationEntities = entities.filter((entity) => entity.templateId === relationshipTemplate.destinationEntityId);

        if (relevantSourceEntities.length === 0 || relevantDestinationEntities.length === 0) {
            // eslint-disable-next-line no-console
            console.warn('No relevant source or destination entities found for this template, skipping...');
            return [];
        }

        if (minNumberOfRelationships > maxNumberOfRelationships) {
            throw new Error('Min cannot be greater than Max for relationships range.');
        }
        return Array.from({ length: chance.integer({ min: minNumberOfRelationships, max: maxNumberOfRelationships }) }, () => {
            const sourceEntityId = relevantSourceEntities[chance.integer({ min: 0, max: relevantSourceEntities.length - 1 })].properties._id;
            const destinationEntityId =
                relevantDestinationEntities[chance.integer({ min: 0, max: relevantDestinationEntities.length - 1 })].properties._id;

            return limit(async () => {
                try {
                    const { data } = await axiosInstance.post<IRelationship>(url + createRelationshipRoute, {
                        relationshipInstance: {
                            sourceEntityId,
                            destinationEntityId,
                            templateId: relationshipTemplate._id,
                        },
                        userId,
                    });
                    return data;
                } catch (error) {
                    if (axios.isAxiosError(error) && error.response?.data.metadata?.errorCode === 'RELATIONSHIP_ALREADY_EXISTS') {
                        // eslint-disable-next-line no-console
                        console.log('Relationship already exists, skipping...');
                    }

                    throw error;
                }
            });
        });
    });

    const results = await Promise.all(promises);

    return results.filter(Boolean) as IRelationship[];
};

export const isInstanceServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

export const updateConstraintsOfTemplate = async (
    workspaceId: string,
    templateId: string,
    constraints: { requiredConstraints: string[]; uniqueConstraints: IUniqueConstraintOfTemplate[] },
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const { data } = await axiosInstance.put(`${url}${updateConstraintsOfTemplateRoute}/${templateId}`, constraints);

    return data;
};
