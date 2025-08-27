/* eslint-disable import/prefer-default-export */
import { IMongoPrintingTemplate, IPrintingTemplate } from '@microservices/shared';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    printingTemplates: { createPrintingTemplateRoute },
} = config.templateService;

export const createPrintingTemplate = async (workspaceId: string, printingTemplateToCreate: IMongoPrintingTemplate) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const { data } = await axiosInstance.post<IMongoPrintingTemplate>(url + createPrintingTemplateRoute, {
        ...printingTemplateToCreate,
    } as IPrintingTemplate);

    return data;
};
