/* eslint-disable no-underscore-dangle */
import axios from 'axios';
// @ts-ignore
import jsf, { generate } from 'json-schema-faker';
import config from './config';
import { IMongoEntityTemplate } from './entityTemplates';

const { uri, createEntityRoute, maxNumberOfEntities, minNumberOfEntities } = config.instacnceManager;

export const createInstances = async (entityTemplates: IMongoEntityTemplate[]) => {
    const promises = entityTemplates
        .map((entityTemplate) => {
            return Array.from({ length: Math.floor(Math.random() * (maxNumberOfEntities - minNumberOfEntities + 1)) + minNumberOfEntities }, () =>
                axios.post(uri + createEntityRoute, {
                    properties: generate(entityTemplate.properties),
                    templateId: entityTemplate._id,
                }),
            );
        })
        .flat();

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};
