import config from '../../config';
import { IRule } from '../../express/templates/rules/interfaces';
import { TemplatesManagerService } from '.';

const {
    templateService: {
        relationships: { baseRelationshipsRoute, baseRulesRoute, updateRuleStatusByIdRouteSuffix },
    },
} = config;

export interface IRelationshipTemplate {
    _id: string;
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
    isProperty: boolean;
}

export interface ISearchRelationshipTemplatesBody {
    search?: string;
    ids?: string[];
    sourceEntityIds?: string[];
    destinationEntityIds?: string[];
    limit?: number;
    skip?: number;
}

export interface ISearchRulesBody {
    search?: string;
    entityTemplateIds?: string[];
    disabled?: boolean;
    limit?: number;
    skip?: number;
}

export class RelationshipsTemplateManagerService extends TemplatesManagerService {
    static async searchRelationshipTemplates(searchBody: ISearchRelationshipTemplatesBody = {}) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IRelationshipTemplate[]>(
            `${baseRelationshipsRoute}/search`,
            searchBody,
        );

        return data;
    }

    static async getRelationshipTemplateById(id: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.get<IRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    static async createRelationshipTemplate(relationship: Omit<IRelationshipTemplate, '_id'>) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IRelationshipTemplate>(baseRelationshipsRoute, relationship);

        return data;
    }

    static async updateRelationshipTemplate(id: string, updatedRelationship: Partial<Omit<IRelationshipTemplate, '_id'>>) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.put<IRelationshipTemplate>(
            `${baseRelationshipsRoute}/${id}`,
            updatedRelationship,
        );

        return data;
    }

    static async deleteRelationshipTemplate(id: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.delete<IRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    static async updateRuleStatusById(ruleId: string, disabled: boolean) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.patch<IRelationshipTemplate>(
            `${baseRulesRoute}/${ruleId}${updateRuleStatusByIdRouteSuffix}`,
            { disabled },
        );

        return data;
    }

    static async searchRules(searchBody: ISearchRulesBody) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IRule[]>(`${baseRulesRoute}/search`, searchBody);

        return data;
    }

    static async getRuleById(ruleId: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.get<IRule>(`${baseRulesRoute}/${ruleId}`);

        return data;
    }

    static async deleteRuleById(ruleId: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.delete<IRule>(`${baseRulesRoute}/${ruleId}`);

        return data;
    }
}
