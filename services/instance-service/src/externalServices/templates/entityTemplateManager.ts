import { IMongoEntityTemplate, ISearchEntityTemplatesBody } from '@microservices/shared';
import TemplatesManagerService from '.';
import config from '../../config';

const {
    templateService: {
        entities: { getByIdRoute, searchRoute, getRelatedByIdRoute },
    },
} = config;

class EntityTemplateManagerService extends TemplatesManagerService {
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

export default EntityTemplateManagerService;
