import config from '../../config';
import { TemplatesManagerService } from '.';
import { IMongoRule, ISearchRulesBody } from './interfaces/rules';
import { IMongoRelationshipTemplate, ISearchRelationshipTemplatesBody } from './interfaces/relationshipTemplates';

const {
    templateService: {
        relationships: { getRelationshipByIdRoute, searchTemplatesRoute, searchRulesRoute },
    },
} = config;

export class RelationshipsTemplateManagerService extends TemplatesManagerService {
    static async searchRelationshipTemplates(searchBody: ISearchRelationshipTemplatesBody = {}) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IMongoRelationshipTemplate[]>(searchTemplatesRoute, searchBody);

        return data;
    }

    static async getRelationshipTemplateById(id: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.get<IMongoRelationshipTemplate>(`${getRelationshipByIdRoute}/${id}`);

        return data;
    }

    static async searchRules(searchBody: Omit<ISearchRulesBody, 'disabled'>) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IMongoRule[]>(searchRulesRoute, {
            ...searchBody,
            disabled: false,
        });

        return data;
    }
}
