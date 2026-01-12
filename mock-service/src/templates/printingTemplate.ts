import { IMongoPrintingTemplate, IPrintingTemplate } from '@packages/printing-template';
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
