/* eslint-disable import/prefer-default-export */
import { IChildTemplate, IMongoChildTemplate, IMongoEntityTemplateWithConstraintsPopulated } from '@microservices/shared';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    childTemplates: { createChildTemplateRoute },
} = config.templateService;

export const createChildTemplate = async (
    workspaceId: string,
    childTemplateToCreate: IChildTemplate,
    parentTemplate: IMongoEntityTemplateWithConstraintsPopulated,
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const { data } = await axiosInstance.post<IMongoChildTemplate>(url + createChildTemplateRoute, {
        ...childTemplateToCreate,
        category: parentTemplate.category._id,
        parentTemplateId: parentTemplate._id,
    } as IChildTemplate);

    return data;
};
