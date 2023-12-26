import axios from 'axios';
import config from './config';

const { uri, createCategoryRoute } = config.entityTemplateManager;

export interface ICategory {
    name: string;
    displayName: string;
}

export interface IMongoCategory extends ICategory {
    _id: string;
}

export const createCategories = async (categories: ICategory[]) => {
    const promises = categories.map((category) => {
        return axios.post<IMongoCategory>(uri + createCategoryRoute, category);
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};

export const getCategories = async () => {
    const result = await axios.get<IMongoCategory[]>(uri + createCategoryRoute);

    return result.data;
};
