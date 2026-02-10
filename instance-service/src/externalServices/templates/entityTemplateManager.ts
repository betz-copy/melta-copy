import { IMongoEntityTemplate, ISearchEntityTemplatesBody } from '@packages/entity-template';
import config from '../../config';
import TemplatesService from '.';

const { getByIdRoute, searchRoute, getRelatedByIdRoute } = config.templateService.entities;

class EntityTemplateService extends TemplatesService {
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
