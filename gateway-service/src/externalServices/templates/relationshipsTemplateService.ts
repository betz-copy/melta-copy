import config from '../../config';
import { IRule } from '../../express/templates/rules/interfaces';
import { TemplatesManagerService } from '.';
import { ISearchBody } from './entityTemplateService';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';

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

export interface ISearchRelationshipTemplatesBody extends ISearchBody {
    ids?: string[];
    sourceEntityIds?: string[];
    destinationEntityIds?: string[];
}

export interface ISearchRulesBody extends ISearchBody {
    entityTemplateIds?: string[];
    disabled?: boolean;
}

export interface RequestWithSearchRelationshipTemplateBody extends RequestWithPermissionsOfUserId {
    searchBody: ISearchRelationshipTemplatesBody;
}

export interface RequestWithSearchRuleTemplateBody extends RequestWithPermissionsOfUserId {
    searchBody: ISearchRulesBody;
}
export interface IConvertToRelationshipField {
    fieldName: string;
    displayFieldName: string;
    relatedTemplateField: string;
    relationshipTemplateDirection: 'outgoing' | 'incoming';
    sourceEntityId: string;
    destinationEntityId: string;
}

export class RelationshipsTemplateService extends TemplatesManagerService {
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
