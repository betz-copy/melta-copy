import config from '../config';
import { createAxiosInstance } from '../utils/axios';

const {
    url,
    entities: { createCategoryRoute },
} = config.templateService;

export interface ICategory {
    name: string;
    displayName: string;
}

export interface IMongoCategory extends ICategory {
    _id: string;
}

export const createCategories = async (workspaceId: string, categories: ICategory[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);
    const results: IMongoCategory[] = [];

    for (const category of categories) {
        const response = await axiosInstance.post<IMongoCategory>(url + createCategoryRoute, category);

        results.push(response.data);
    }

    return results;
};
