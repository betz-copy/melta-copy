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

    const promises = categories.map((category) => {
        return axiosInstance.post<IMongoCategory>(url + createCategoryRoute, category);
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};
