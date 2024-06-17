import config from '../config';
import { IRule } from '../express/templates/rules/interfaces';
import DefaultExternalServiceApi from '../utils/express/externalService';

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

export class RelationshipsTemplateManagerService extends DefaultExternalServiceApi {
    constructor(dbName: string) {
        super(dbName, { baseURL: url, timeout: requestTimeout });
    }

    async searchRelationshipTemplates(searchBody: ISearchRelationshipTemplatesBody = {}) {
        const { data } = await this.api.post<IRelationshipTemplate[]>(`${baseRelationshipsRoute}/search`, searchBody);
        return data;
    }

    async getRelationshipTemplateById(id: string) {
        const { data } = await this.api.get<IRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`);
        return data;
    }

    async createRelationshipTemplate(relationship: Omit<IRelationshipTemplate, '_id'>) {
        const { data } = await this.api.post<IRelationshipTemplate>(baseRelationshipsRoute, relationship);
        return data;
    }

    async updateRelationshipTemplate(id: string, updatedRelationship: Partial<Omit<IRelationshipTemplate, '_id'>>) {
        const { data } = await this.api.put<IRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`, updatedRelationship);
        return data;
    }

    async deleteRelationshipTemplate(id: string) {
        const { data } = await this.api.delete<IRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`);
        return data;
    }

    async updateRuleStatusById(ruleId: string, disabled: boolean) {
        const { data } = await this.api.patch<IRelationshipTemplate>(`${baseRulesRoute}/${ruleId}${updateRuleStatusByIdRouteSuffix}`, { disabled });
        return data;
    }

    async searchRules(searchBody: ISearchRulesBody) {
        const { data } = await this.api.post<IRule[]>(`${baseRulesRoute}/search`, searchBody);
        return data;
    }

    async getRuleById(ruleId: string) {
        const { data } = await this.api.get<IRule>(`${baseRulesRoute}/${ruleId}`);
        return data;
    }

    async deleteRuleById(ruleId: string) {
        const { data } = await this.api.delete<IRule>(`${baseRulesRoute}/${ruleId}`);
        return data;
    }
}
