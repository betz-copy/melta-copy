/* eslint-disable no-underscore-dangle */
import axios from 'axios';
import { IMongoCategory } from './categories';
import config from './config';

const { uri, createEntityTemplateRoute } = config.entityTemplateManager;

export interface IEntityTemplate {
    name: string;
    displayName: string;
    properties: any;
    category: {
        name: string;
    };
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}

export const createEntityTemplates = async (entityTemplates: IEntityTemplate[], categories: IMongoCategory[]) => {
    const promises = entityTemplates.map((entityTemplate) => {
        return axios.post<IMongoEntityTemplate>(uri + createEntityTemplateRoute, {
            ...entityTemplate,
            category: categories.find((category) => category.name === entityTemplate.category.name)?._id,
        });
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};
