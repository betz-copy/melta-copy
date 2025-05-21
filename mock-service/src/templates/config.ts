import config from '../config';
import createAxiosInstance from '../utils/axios';
import { IMongoCategory, IOrderConfig, IMongoOrderConfig, ConfigTypes } from '@microservices/shared';

const {
    url,
    config: { createOrderConfigRoute },
} = config.templateService;

export const createCategoryOrder = async (workspaceId: string, categories: IMongoCategory[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);
    const data: IOrderConfig = {
        name: 'categoryOrder',
        type: ConfigTypes.ORDER,
        order: categories.map((category) => category._id),
    };

    const response = await axiosInstance.post<IMongoOrderConfig>(url + createOrderConfigRoute, data);

    return response.data;
};
