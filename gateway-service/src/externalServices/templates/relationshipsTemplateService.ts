import { IMongoRelationshipTemplate, ISearchRelationshipTemplatesBody } from '@packages/relationship-template';
import { IMongoRule, IRule, ISearchRulesBody } from '@packages/rule';

import config from '../../config';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import TemplatesManagerService from '.';

const {
    templateService: {
        relationships: { baseRelationshipsRoute, baseRulesRoute, updateRuleStatusByIdRouteSuffix },
    },
} = config;

export type RequestWithSearchRelationshipTemplateBody = RequestWithPermissionsOfUserId & {
    searchBody: ISearchRelationshipTemplatesBody;
};

export type RequestWithSearchRuleTemplateBody = RequestWithPermissionsOfUserId & {
    searchBody: ISearchRulesBody;
};

class RelationshipsTemplateService extends TemplatesManagerService {
    async searchRelationshipTemplates(searchBody: ISearchRelationshipTemplatesBody = {}) {
        const { data } = await this.api.post<IMongoRelationshipTemplate[]>(`${baseRelationshipsRoute}/search`, searchBody);
        return data;
    }

    async getRelationshipTemplateById(id: string) {
        const { data } = await this.api.get<IMongoRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    async createRelationshipTemplate(relationship: Omit<IMongoRelationshipTemplate, '_id'>) {
        const { data } = await this.api.post<IMongoRelationshipTemplate>(baseRelationshipsRoute, relationship);

        return data;
    }

    async updateRelationshipTemplate(id: string, updatedRelationship: Partial<Omit<IMongoRelationshipTemplate, '_id'>>) {
        const { data } = await this.api.put<IMongoRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`, updatedRelationship);

        return data;
    }

    async deleteRelationshipTemplate(id: string) {
        const { data } = await this.api.delete<IMongoRelationshipTemplate>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    async updateRuleStatusById(ruleId: string, disabled: boolean) {
        const { data } = await this.api.patch<IMongoRelationshipTemplate>(`${baseRulesRoute}/${ruleId}${updateRuleStatusByIdRouteSuffix}`, {
            disabled,
        });

        return data;
    }

    async searchRules(searchBody: ISearchRulesBody) {
        const { data } = await this.api.post<IMongoRule[]>(`${baseRulesRoute}/search`, searchBody);

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

    async getManyRulesByIds(rulesIds: string[]) {
        const { data } = await this.api.post<IMongoRule[]>(`${baseRulesRoute}/get-many`, { rulesIds });

        return data;
    }
}

export default RelationshipsTemplateService;
