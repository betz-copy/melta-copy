import { IEntityTemplate, IMongoCategory, IMongoEntityTemplateWithConstraintsPopulated } from '@microservices/shared';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    entities: { createEntityTemplateRoute },
} = config.templateService;

export interface IEntityTemplateMock extends Omit<IEntityTemplate, 'category' | 'iconFileId'> {
    category: { name: string };
}

export const createEntityTemplates = async (workspaceId: string, entityTemplatesToCreate: IEntityTemplateMock[], categories: IMongoCategory[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const promises = entityTemplatesToCreate.map((entityTemplate) => {
        return axiosInstance.post<IMongoEntityTemplateWithConstraintsPopulated>(url + createEntityTemplateRoute, {
            ...entityTemplate,
            category: categories.find((category) => category.name === entityTemplate.category.name)?._id,
        });
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};
