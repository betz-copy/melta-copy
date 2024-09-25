// @ts-ignore
import { generate, format, JSONSchemaFaker } from 'json-schema-faker';
import pLimit from 'p-limit';
import axios from 'axios';
import config from './config';
import { IRelationship } from './interfaces/relationships';
import { IMongoEntityTemplate } from './templates/entityTemplates';
import { IMongoRelationshipTemplate } from './templates/relationshipTemplates';
import { trycatch } from './utils';
import { createAxiosInstance } from './utils/axios';

const limit = pLimit(config.requestLimit);

const {
    url,
    createEntityRoute,
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
    entityTemplates: IMongoEntityTemplate[],
    chance: Chance.Chance,
    fileId: string,
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    JSONSchemaFaker.format('fileId', (_value) => fileId);

    const promises = entityTemplates
        .map((entityTemplate) => {
            return Array.from({ length: chance.integer({ min: minNumberOfEntities, max: maxNumberOfEntities }) }, () =>
                limit(() =>
                    axiosInstance.post(url + createEntityRoute, {
                        properties: JSONSchemaFaker.generate(entityTemplate.properties),
                        templateId: entityTemplate._id,
                        userId,
                    }),
                ),
            );
        })
        .flat();

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

    const promises = relationshipTemplates
        .map((relationshipTemplate) => {
            const relevantSourceEntities = entities.filter((entity) => entity.templateId === relationshipTemplate.sourceEntityId);
            const relevantDestinationEntities = entities.filter((entity) => entity.templateId === relationshipTemplate.destinationEntityId);

            if (relevantSourceEntities.length === 0 || relevantDestinationEntities.length === 0) {
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
                            console.log('Relationship already exists, skipping...');
                        }

                        // throw error;
                        console.log({ error });
                        return '';
                    }
                });
            });
        })
        .flat();

    const results = await Promise.all(promises);

    return results.filter(Boolean) as IRelationship[];
};

export const isInstanceServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};
