import { IMongoCategory } from '@packages/category';
import { IEntityTemplate, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
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
    const results: IMongoEntityTemplateWithConstraintsPopulated[] = [];

    for (const entityTemplate of entityTemplatesToCreate) {
        const categoryId = categories.find((category) => category.name === entityTemplate.category.name)?._id;
        // eslint-disable-next-line no-await-in-loop
        const response = await axiosInstance.post<IMongoEntityTemplateWithConstraintsPopulated>(url + createEntityTemplateRoute, {
            ...entityTemplate,
            category: categoryId,
        });

        results.push(response.data);
    }

    return results;
};
