import { ISearchEntityTemplatesBody } from '@packages/entity-template';
import { IMongoPrintingTemplate } from '@packages/printing-template';
import config from '../../config';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import TemplatesManagerService from '.';

const {
    templateService: {
        printingTemplates: { basePrintingTemplatesRoute },
    },
} = config;

export type RequestWithSearchPrintingTemplateBody = RequestWithPermissionsOfUserId & {
    searchBody: ISearchEntityTemplatesBody;
};

class PrintingTemplateService extends TemplatesManagerService {
    async getAllPrintingTemplates(): Promise<IMongoPrintingTemplate[]> {
        const { data } = await this.api.get<IMongoPrintingTemplate[]>(`${basePrintingTemplatesRoute}/all`);
        return data;
    }

    async searchPrintingTemplates(searchBody: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IMongoPrintingTemplate[]>(`${basePrintingTemplatesRoute}/search`, searchBody);
        return data;
    }

    async getPrintingTemplateById(id: string) {
        const { data } = await this.api.get<IMongoPrintingTemplate>(`${basePrintingTemplatesRoute}/${id}`);
        return data;
    }

    async createPrintingTemplate(printingTemplate: Omit<IMongoPrintingTemplate, '_id' | 'createdAt' | 'updatedAt'>) {
        const { data } = await this.api.post<IMongoPrintingTemplate>(basePrintingTemplatesRoute, printingTemplate);
        return data;
    }

    async updatePrintingTemplate(id: string, updatedPrintingTemplate: Partial<Omit<IMongoPrintingTemplate, '_id'>>) {
        const { data } = await this.api.put<IMongoPrintingTemplate>(`${basePrintingTemplatesRoute}/${id}`, updatedPrintingTemplate);
        return data;
    }

    async deletePrintingTemplate(id: string) {
        const { data } = await this.api.delete<IMongoPrintingTemplate>(`${basePrintingTemplatesRoute}/${id}`);
        return data;
    }
}

export default PrintingTemplateService;
