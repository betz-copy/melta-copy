/* eslint-disable import/prefer-default-export */
import { IChildTemplate, IMongoChildTemplate, IMongoEntityTemplateWithConstraintsPopulated } from '@microservices/shared';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    entityChildTemplates: { createEntityChildTemplateRoute },
} = config.templateService;

export const createEntityChildTemplate = async (
    workspaceId: string,
    entityChildTemplateToCreate: IChildTemplate,
    parentTemplate: IMongoEntityTemplateWithConstraintsPopulated,
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const { data } = await axiosInstance.post<IMongoChildTemplate>(url + createEntityChildTemplateRoute, {
        ...entityChildTemplateToCreate,
        categories: [parentTemplate.category._id],
        parentTemplateId: parentTemplate._id,
    });

    return data;
};
