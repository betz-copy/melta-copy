import { IMongoRelationshipTemplate, ISearchRelationshipTemplatesBody } from '@packages/relationship-template';
import { IMongoRule, ISearchRulesBody } from '@packages/rule';
import config from '../../config';
import TemplatesService from '.';

const { getRelationshipByIdRoute, searchTemplatesRoute, searchRulesRoute } = config.templateService.relationships;

class RelationshipsTemplateManagerService extends TemplatesService {
    async searchRelationshipTemplates(searchBody: ISearchRelationshipTemplatesBody = {}) {
        const { data } = await this.api.post<IMongoRelationshipTemplate[]>(searchTemplatesRoute, searchBody);

        return data;
    }

    async getRelationshipTemplateById(id: string) {
        const { data } = await this.api.get<IMongoRelationshipTemplate>(`${getRelationshipByIdRoute}/${id}`);

        return data;
    }

    async searchRules(searchBody: Omit<ISearchRulesBody, 'disabled'>) {
        const { data } = await this.api.post<IMongoRule[]>(searchRulesRoute, {
            ...searchBody,
            disabled: false,
        });

        return data;
    }
}

export default RelationshipsTemplateManagerService;
