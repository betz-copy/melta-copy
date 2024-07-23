import config from '../config';
import { Axios } from '../utils/axios';

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

export const createCategories = async (categories: ICategory[]) => {
    const promises = categories.map((category) => {
        return Axios.post<IMongoCategory>(url + createCategoryRoute, category);
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};

export const getCategories = async () => {
    const result = await Axios.get<IMongoCategory[]>(url + createCategoryRoute);

    return result.data;
};
