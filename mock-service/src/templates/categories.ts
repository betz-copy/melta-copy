/* eslint-disable import/prefer-default-export */
import { ICategory, IMongoCategory } from '@packages/category';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    entities: { createCategoryRoute },
} = config.templateService;

export const createCategories = async (workspaceId: string, categories: ICategory[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const promises = categories.map((category) =>
        axiosInstance.post<IMongoCategory>(url + createCategoryRoute, { ...category, templatesOrder: undefined }),
    );

    const responses = await Promise.all(promises);
    return responses.map((response) => response.data);
};
