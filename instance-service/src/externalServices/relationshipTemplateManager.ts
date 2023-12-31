import axios from 'axios';

import config from '../config';
import { IMongoRule } from '../express/rules/interfaces';

const { relationshipTemplateService: relationshipManager } = config;
const { url, getRelationshipByIdRoute, searchTemplatesRoute, searchRulesRoute, timeout } = relationshipManager;

export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface IMongoRelationshipTemplate extends IRelationshipTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
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
    unpinnedEntityTemplateIds?: string[];
    disabled?: boolean;
    limit?: number;
    skip?: number;
}

export class RelationshipsTemplateManagerService {
    static RelationshipsTemplateManagerAxiosApi = axios.create({ baseURL: url, timeout });

    static async searchRelationshipTemplates(searchBody: ISearchRelationshipTemplatesBody = {}) {
        const { data } = await RelationshipsTemplateManagerService.RelationshipsTemplateManagerAxiosApi.post<IMongoRelationshipTemplate[]>(
            searchTemplatesRoute,
            searchBody,
        );

        return data;
    }

    static async getRelationshipTemplateById(id: string) {
        const { data } = await RelationshipsTemplateManagerService.RelationshipsTemplateManagerAxiosApi.get<IMongoRelationshipTemplate>(
            `${getRelationshipByIdRoute}/${id}`,
        );

        return data;
    }

    static async searchRules(searchBody: Omit<ISearchRulesBody, 'disabled'>) {
        const { data } = await RelationshipsTemplateManagerService.RelationshipsTemplateManagerAxiosApi.post<IMongoRule[]>(searchRulesRoute, {
            ...searchBody,
            disabled: false,
        });

        return data;
    }
}
