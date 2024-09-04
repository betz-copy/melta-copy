import config from '../../config';
import { TemplatesManagerService } from '.';
import { IMongoEntityTemplate, ISearchEntityTemplatesBody } from './interfaces/entityTemplates';

const {
    templateService: {
        entities: { getByIdRoute, searchRoute, getRelatedByIdRoute },
    },
} = config;

export class EntityTemplateManagerService extends TemplatesManagerService {
    // entity templates
    static async getEntityTemplateById(id: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.get<IMongoEntityTemplate>(`${getByIdRoute}/${id}`);

        return data;
    }

    static async getTemplatesUsingRelationshipReference(relatedTemplateId: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.get<IMongoEntityTemplate[]>(
            `${getRelatedByIdRoute}/${relatedTemplateId}`,
        );

        return data;
    }

    static async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IMongoEntityTemplate[]>(searchRoute, body);

        return data;
    }
}
