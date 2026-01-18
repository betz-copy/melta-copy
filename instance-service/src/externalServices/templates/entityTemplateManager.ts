import { IMongoEntityTemplate, ISearchEntityTemplatesBody } from '@microservices/shared';
import config from '../../config';
import TemplatesManagerService from '.';

const {
    templateService: {
        entities: { getByIdRoute, searchRoute, getRelatedByIdRoute },
    },
} = config;

class EntityTemplateService extends TemplatesManagerService {
    // entity templates
    async getEntityTemplateById(id: string) {
        const { data } = await this.api.get<IMongoEntityTemplate>(`${getByIdRoute}/${id}`);

        return data;
    }

    async getTemplatesUsingRelationshipReference(relatedTemplateId: string) {
        const { data } = await this.api.get<IMongoEntityTemplate[]>(`${getRelatedByIdRoute}/${relatedTemplateId}`);

        return data;
    }

    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IMongoEntityTemplate[]>(searchRoute, body);

        return data;
    }
}

export default EntityTemplateService;
