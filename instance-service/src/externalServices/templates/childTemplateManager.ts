import { IChildTemplatePopulated } from '@packages/child-template';
import { ISearchEntityTemplatesBody } from '@packages/entity-template';
import config from '../../config';
import TemplatesManagerService from '.';

const {
    templateService: {
        children: { getByIdRoute, searchRoute, getRelatedByIdRoute },
    },
} = config;

class ChildTemplateManagerService extends TemplatesManagerService {
    async getChildTemplateById(id: string) {
        const { data } = await this.api.get<IChildTemplatePopulated>(`${getByIdRoute}/${id}`);

        return data;
    }

    async getChildTemplatesUsingRelationshipReference(relatedTemplateId: string) {
        const { data } = await this.api.get<IChildTemplatePopulated[]>(`${getRelatedByIdRoute}/${relatedTemplateId}`);

        return data;
    }

    async searchChildTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IChildTemplatePopulated[]>(searchRoute, body);

        return data;
    }
}

export default ChildTemplateManagerService;
