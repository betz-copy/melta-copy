import { TemplatesManagerService } from '.';
import config from '../../config';
import { IMongoRelationshipTemplate, ISearchRelationshipTemplatesBody } from './interfaces/relationshipTemplates';
import { IMongoRule, ISearchRulesBody } from './interfaces/rules';

const {
    templateService: {
        relationships: { getRelationshipByIdRoute, searchTemplatesRoute, searchRulesRoute },
    },
} = config;

export class RelationshipsTemplateManagerService extends TemplatesManagerService {
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
