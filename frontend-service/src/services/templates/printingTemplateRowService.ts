import { searchPrintingTemplatesRequest, deletePrintingTemplateRequest } from './printingTemplateService';

export const fetchPrintingTemplates = async () => {
    return await searchPrintingTemplatesRequest({});
};

export const deletePrintingTemplate = async (templateId: string) => {
    return await deletePrintingTemplateRequest(templateId);
};
