/* eslint-disable import/prefer-default-export */
import { ICategory, IMongoCategory } from '@microservices/shared';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    entities: { createCategoryRoute },
} = config.templateService;

export const createCategories = async (workspaceId: string, categories: ICategory[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);
    const results: IMongoCategory[] = [];

    for (const category of categories) {
        const response = await axiosInstance.post<IMongoCategory>(url + createCategoryRoute, category);

        results.push(response.data);
    }

    return results;
};
