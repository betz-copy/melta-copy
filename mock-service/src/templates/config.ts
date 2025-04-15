import config from '../config';
import { createAxiosInstance } from '../utils/axios';
import { IMongoCategory } from './categories';

const {
    url,
    config: { createOrderConfigRoute },
} = config.templateService;

export interface IOrderConfig {
    name: string;
    type: 'order';
    order: string[];
}

export interface IMongoOrderConfig extends IOrderConfig {
    _id: string;
}

export const createCategoryOrder = async (workspaceId: string, categories: IMongoCategory[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);
    const data: IOrderConfig = {
        name: 'categoryOrder',
        type: 'order',
        order: categories.map((category) => category._id),
    };

    const response = await axiosInstance.post<IMongoOrderConfig>(url + createOrderConfigRoute, data);

    return response.data;
};
