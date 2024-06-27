import config from '../../config';
import { IMongoRule } from '../../express/rules/interfaces';
import { TemplatesManagerService } from '.';

const {
    templateService: {
        relationships: { getRelationshipByIdRoute, searchTemplatesRoute, searchRulesRoute },
    },
} = config;

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
