/* eslint-disable no-underscore-dangle */
import axios from 'axios';
// @ts-ignore
import { generate, format } from 'json-schema-faker';
import * as pLimit from 'p-limit';
import config from './config';
import { IMongoEntityTemplate } from './entityTemplates';
import { IMongoRealtionshipTemplate } from './relationshipTemplates';
import { trycatch } from './utils';

const limit = pLimit(config.requestLimit);

const {
    uri,
    createEntityRoute,
    maxNumberOfEntities,
    minNumberOfEntities,
    createRelationshipRoute,
    maxNumberOfRelationships,
    minNumberOfRelationships,
    isAliveRoute,
} = config.instacnceManager;

format('fileId', (_value) => 'asosaf8sfbla bla.docx');

export const createInstances = async (entityTemplates: IMongoEntityTemplate[]) => {
    const promises = entityTemplates
        .map((entityTemplate) => {
            return Array.from({ length: Math.floor(Math.random() * (maxNumberOfEntities - minNumberOfEntities + 1)) + minNumberOfEntities }, () =>
                limit(() =>
                    axios.post(uri + createEntityRoute, {
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
    relationsipTemplates: IMongoRealtionshipTemplate[],
) => {
    const promises = relationsipTemplates
        .map((relationshipTemplate) => {
            const relevantSourceEntities = entities.filter((entity) => entity.templateId === relationshipTemplate.sourceEntityId);
            const relevantDestinationEntities = entities.filter((entity) => entity.templateId === relationshipTemplate.destinationEntityId);

            return Array.from(
                { length: Math.floor(Math.random() * (maxNumberOfRelationships - minNumberOfRelationships + 1)) + minNumberOfRelationships },
                () => {
                    const sourceEntityId = relevantSourceEntities[Math.floor(Math.random() * relevantSourceEntities.length)].properties._id;
                    const destinationEntityId =
                        relevantDestinationEntities[Math.floor(Math.random() * relevantDestinationEntities.length)].properties._id;

                    return limit(async () => {
                        const { result } = await trycatch(() =>
                            axios.post(uri + createRelationshipRoute, {
                                sourceEntityId,
                                destinationEntityId,
                                templateId: relationshipTemplate._id,
                            }),
                        );
                        return result;
                    });
                },
            );
        })
        .flat();

    const results = await Promise.all(promises);

    return results.map((result) => result?.data);
};

export const isInstanceManagerAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(uri + isAliveRoute));

    return { result, err };
};
