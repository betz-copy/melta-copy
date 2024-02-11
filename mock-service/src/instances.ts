// @ts-ignore
import { format, generate } from 'json-schema-faker';
import * as pLimit from 'p-limit';
import config from './config';
import { IMongoEntityTemplate } from './entityTemplates';
import { IMongoRelationshipTemplate } from './relationshipTemplates';
import { trycatch } from './utils';
import { Axios } from './utils/axios';

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

export const createInstances = async (entityTemplates: IMongoEntityTemplate[], chance: Chance.Chance, fileId: string) => {
    format('fileId', (_value) => fileId);
    const promises = entityTemplates
        .map((entityTemplate) => {
            return Array.from({ length: chance.integer({ min: minNumberOfEntities, max: maxNumberOfEntities }) }, () =>
                limit(() =>
                    Axios.post(url + createEntityRoute, {
                        properties: generate(entityTemplate.properties),
                        templateId: entityTemplate._id,
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
                        Axios.post(url + createRelationshipRoute, {
                            relationshipInstance: {
                                sourceEntityId,
                                destinationEntityId,
                                templateId: relationshipTemplate._id,
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
    const { result, err } = await trycatch(() => Axios.get(url + isAliveRoute));

    return { result, err };
};
