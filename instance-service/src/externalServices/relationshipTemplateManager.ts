import config from '../config';
import { IMongoRule } from '../express/rules/interfaces';
import DefaultExternalServiceApi from '../utils/express/externalService';

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

export class RelationshipsTemplateManagerService extends DefaultExternalServiceApi {
    constructor(dbName: string) {
        super(dbName, { baseURL: url, timeout });
    }

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
