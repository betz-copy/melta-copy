import { IEntityChildTemplatePopulated, ISearchEntityTemplatesBody } from '@microservices/shared';
import TemplatesManagerService from '.';
import config from '../../config';

const {
    templateService: {
        children: { getByIdRoute, searchRoute, getRelatedByIdRoute },
    },
} = config;

class EntityChildTemplateManagerService extends TemplatesManagerService {
    async getEntityChildTemplateById(id: string) {
        const { data } = await this.api.get<IEntityChildTemplatePopulated>(`${getByIdRoute}/${id}`);

        return data;
    }

    async getChildTemplatesUsingRelationshipReference(relatedTemplateId: string) {
        const { data } = await this.api.get<IEntityChildTemplatePopulated[]>(`${getRelatedByIdRoute}/${relatedTemplateId}`);

        return data;
    }

    async searchEntityChildTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IEntityChildTemplatePopulated[]>(searchRoute, body);

        return data;
    }
}

export default EntityChildTemplateManagerService;
