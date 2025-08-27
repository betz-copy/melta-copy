import { IMongoPrintingTemplate, ISearchEntityTemplatesBody } from '@microservices/shared';
import config from '../../config';
import TemplatesManagerService from '.';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';

const {
    templateService: {
        printingTemplates: { basePrintingTemplatesRoute },
    },
} = config;

export interface RequestWithSearchPrintingTemplateBody extends RequestWithPermissionsOfUserId {
    searchBody: ISearchEntityTemplatesBody;
}

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
