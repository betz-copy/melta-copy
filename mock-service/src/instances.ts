import axios from 'axios';
// @ts-ignore
import { generate, format, JSONSchemaFaker } from 'json-schema-faker';
import pLimit from 'p-limit';
import config from './config';
import { IMongoEntityTemplate } from './templates/entityTemplates';
import { IMongoRelationshipTemplate } from './templates/relationshipTemplates';
import { trycatch } from './utils';

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

const userId = config.permissionsService.managersKrtoffelIds[0];

export const createInstances = async (entityTemplates: IMongoEntityTemplate[], chance: Chance.Chance, fileId: string) => {
    format('fileId', (_value) => fileId);
    const promises = entityTemplates
        .map((entityTemplate) => {
            return Array.from({ length: chance.integer({ min: minNumberOfEntities, max: maxNumberOfEntities }) }, () =>
                limit(() =>
                    axios.post(url + createEntityRoute, {
                        properties: generate(entityTemplate.properties),
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
    entities: { properties: { _id: string }; templateId: string }[],
    relationshipTemplates: IMongoRelationshipTemplate[],
    chance: Chance.Chance,
) => {
    const promises = relationshipTemplates
        .map((relationshipTemplate) => {
            const relevantSourceEntities = entities.filter((entity) => entity.templateId === relationshipTemplate.sourceEntityId);
            const relevantDestinationEntities = entities.filter((entity) => entity.templateId === relationshipTemplate.destinationEntityId);

            return Array.from({ length: chance.integer({ min: minNumberOfRelationships, max: maxNumberOfRelationships }) }, () => {
                const sourceEntityId = relevantSourceEntities[chance.integer({ min: 0, max: relevantSourceEntities.length - 1 })].properties._id;
                const destinationEntityId =
                    relevantDestinationEntities[chance.integer({ min: 0, max: relevantDestinationEntities.length - 1 })].properties._id;

                return limit(async () => {
                    const { result } = await trycatch(() =>
                        axios.post(url + createRelationshipRoute, {
                            relationshipInstance: {
                                sourceEntityId,
                                destinationEntityId,
                                templateId: relationshipTemplate._id,
                                userId,
                            },
                        }),
                    );
                    return result;
                });
            });
        })
        .flat();

    const results = await Promise.all(promises);

    return results.map((result) => result?.data);
};

export const isInstanceServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};
