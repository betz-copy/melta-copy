/* eslint-disable import/prefer-default-export */
import { IMongoCategory } from '@packages/category';
import { ConfigTypes, ICategoryOrderConfig, IMongoCategoryOrderConfig } from '@packages/workspace-configs';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    config: { createOrderConfigRoute },
} = config.templateService;

export const createCategoryOrder = async (workspaceId: string, categories: IMongoCategory[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);
    const data: ICategoryOrderConfig = {
        type: ConfigTypes.CATEGORY_ORDER,
        order: categories.map((category) => category._id),
    };

    const response = await axiosInstance.post<IMongoCategoryOrderConfig>(url + createOrderConfigRoute, data);

    return response.data;
};
