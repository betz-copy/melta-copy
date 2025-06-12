/* eslint-disable import/prefer-default-export */
import { IEntityChildTemplate, IMongoEntityChildTemplate, IMongoEntityTemplateWithConstraintsPopulated } from '@microservices/shared';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    entityChildTemplates: { createEntityChildTemplateRoute },
} = config.templateService;

export const createEntityChildTemplate = async (
    workspaceId: string,
    entityChildTemplateToCreate: IEntityChildTemplate,
    fatherTemplate: IMongoEntityTemplateWithConstraintsPopulated,
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const { data } = await axiosInstance.post<IMongoEntityChildTemplate>(url + createEntityChildTemplateRoute, {
        ...entityChildTemplateToCreate,
        categories: [fatherTemplate.category._id],
        fatherTemplateId: fatherTemplate._id,
    });

    return data;
};
