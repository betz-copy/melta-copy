import axios from 'axios';
import config from '../config';

const {
    relationshipTemplateManager: { uri, baseRelationshipsRoute, baseRulesRoute, updateRuleStatusByIdRouteSuffix, requestTimeout },
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

export interface IRelationshipTemplateRule {
    name: string;
    description: string;
    actionOnFail: 'WARNING' | 'ENFORCEMENT';
    relationshipTemplateId: string;
    pinnedEntityTemplateId: string; // sourceEntityTemplate or destinationEntityTemplate
    formula: object; // IFormula;
    disabled: boolean;
}

export interface ISearchRulesBody {
    search?: string;
    relationshipTemplateIds?: string[];
    pinnedEntityTemplateIds?: string[];
    disabled?: boolean;
    limit: number;
    skip: number;
}

export class RelationshipsTemplateManagerService {
    private static RelationshipsTemplateManagerApi = axios.create({ baseURL: uri, timeout: requestTimeout });

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
        const { data } = await this.RelationshipsTemplateManagerApi.post<IRelationshipTemplateRule[]>(`${baseRulesRoute}/search`, searchBody);

        return data;
    }
}
