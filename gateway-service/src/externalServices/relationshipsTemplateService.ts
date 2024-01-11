import axios from 'axios';
import config from '../config';
import { IRule } from '../express/templates/rules/interfaces';

const {
    relationshipTemplateService: { url, baseRelationshipsRoute, baseRulesRoute, updateRuleStatusByIdRouteSuffix, requestTimeout },
} = config;

export interface IRelationshipTemplate {
    _id: string;
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
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
    relationshipTemplateIds?: string[];
    pinnedEntityTemplateIds?: string[];
    disabled?: boolean;
    limit?: number;
    skip?: number;
}

export class RelationshipsTemplateManagerService {
    private static RelationshipsTemplateManagerApi = axios.create({ baseURL: url, timeout: requestTimeout });

    static async searchRelationshipTemplates(searchBody: ISearchRelationshipTemplatesBody = {}) {
        const { data } = await this.RelationshipsTemplateManagerApi.post<IRelationshipTemplate[]>(`${baseRelationshipsRoute}/search`, searchBody);

        return data;
    }

    static async getRelationshipTemplateById(id: string) {
        const { data } = await this.RelationshipsTemplateManagerApi.get<IRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    static async createRelationshipTemplate(relationship: Omit<IRelationshipTemplate, '_id'>) {
        const { data } = await this.RelationshipsTemplateManagerApi.post<IRelationshipTemplate>(baseRelationshipsRoute, relationship);

        return data;
    }

    static async updateRelationshipTemplate(id: string, updatedRelationship: Partial<Omit<IRelationshipTemplate, '_id'>>) {
        const { data } = await this.RelationshipsTemplateManagerApi.put<IRelationshipTemplate>(
            `${baseRelationshipsRoute}/${id}`,
            updatedRelationship,
        );

        return data;
    }

    static async deleteRelationshipTemplate(id: string) {
        const { data } = await this.RelationshipsTemplateManagerApi.delete<IRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    static async updateRuleStatusById(ruleId: string, disabled: boolean) {
        const { data } = await this.RelationshipsTemplateManagerApi.patch<IRelationshipTemplate>(
            `${baseRulesRoute}/${ruleId}${updateRuleStatusByIdRouteSuffix}`,
            { disabled },
        );

        return data;
    }

    static async searchRules(searchBody: ISearchRulesBody) {
        const { data } = await this.RelationshipsTemplateManagerApi.post<IRule[]>(`${baseRulesRoute}/search`, searchBody);

        return data;
    }

    static async getRuleById(ruleId: string) {
        const { data } = await this.RelationshipsTemplateManagerApi.get<IRule>(`${baseRulesRoute}/${ruleId}`);

        return data;
    }

    static async deleteRuleById(ruleId: string) {
        const { data } = await this.RelationshipsTemplateManagerApi.delete<IRule>(`${baseRulesRoute}/${ruleId}`);

        return data;
    }
}
