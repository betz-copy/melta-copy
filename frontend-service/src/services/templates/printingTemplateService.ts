import { IMongoPrintingTemplate, IPrintingTemplate } from '@packages/printing-template';
import axios from '../../axios';
import { environment } from '../../globals';

const { printingTemplates } = environment.api;

const getAllPrintingTemplatesRequest = async () => {
    const { data } = await axios.get<IMongoPrintingTemplate[]>(`${printingTemplates}/all`);
    return data;
};

const getPrintingTemplateByIdRequest = async (id: string) => {
    const { data } = await axios.get<IMongoPrintingTemplate>(`${printingTemplates}/${id}`);
    return data;
};

const createPrintingTemplateRequest = async (newPrintingTemplate: IPrintingTemplate) => {
    const { data } = await axios.post<IMongoPrintingTemplate>(`${printingTemplates}`, newPrintingTemplate);
    return data;
};

const updatePrintingTemplateRequest = async (printingTemplateId: string, updatedPrintingTemplate: IPrintingTemplate) => {
    const { data } = await axios.put<IMongoPrintingTemplate>(`${printingTemplates}/${printingTemplateId}`, updatedPrintingTemplate);
    return data;
};

const deletePrintingTemplateRequest = async (printingTemplateId: string) => {
    const { data } = await axios.delete<IMongoPrintingTemplate>(`${printingTemplates}/${printingTemplateId}`);
    return data;
};

const searchPrintingTemplatesRequest = async (searchBody: Partial<ISearchEntityTemplateQuery> = {}) => {
    const { data } = await axios.post<IMongoPrintingTemplate[]>(`${printingTemplates}/search`, searchBody);
    return data;
};

export {
    getAllPrintingTemplatesRequest,
    getPrintingTemplateByIdRequest,
    createPrintingTemplateRequest,
    updatePrintingTemplateRequest,
    deletePrintingTemplateRequest,
    searchPrintingTemplatesRequest,
};
