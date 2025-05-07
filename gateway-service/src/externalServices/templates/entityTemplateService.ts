import { TemplatesManagerService } from '.';
import config from '../../config';
import { Authorizer, RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import { ISearchFilter } from '../instanceService/interfaces/entities';
import { ISubCompactPermissions } from '../userService/interfaces/permissions/permissions';
import { IMongoRelationshipTemplate } from './relationshipsTemplateService';

const {
    service: { workspaceIdHeaderName },
    templateService: {
        baseRoute,
        entities: { baseEntitiesRoute, baseCategoriesRoute },
    },
} = config;

export interface ICategory {
    name: string;
    displayName: string;
    iconFileId: string | null;
    color: string;
}

export interface IMongoCategory extends ICategory {
    _id: string;
    createdAt: string;
    updatedAt: string;
}
export interface ISearchCategoriesBody {
    search?: string;
    ids?: string[];
    limit?: number;
    skip?: number;
}

export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?:
        | 'date'
        | 'date-time'
        | 'email'
        | 'fileId'
        | 'text-area'
        | 'relationshipReference'
        | 'location'
        | 'user'
        | 'signature'
        | 'kartoffelUserField'
        | 'comment';
    enum?: string[];
    readOnly?: true;
    identifier?: true;
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId' | 'user';
    };
    minItems?: 1;
    uniqueItems?: true;
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: number;
    isDailyAlert?: boolean;
    isDatePastAlert?: boolean;
    calculateTime?: boolean;
    serialStarter?: number;
    serialCurrent?: number;
    expandedUserField?: {
        relatedUserField: string;
        kartoffelField: string;
    };
    isNewPropNameEqualDeletedPropName?: boolean;
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
        filters?: ISearchFilter;
    };
    archive?: boolean;
    filterRelationList?: boolean;
    comment?: string;
    color?: string;
    hideFromDetailsPage?: boolean;
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        hide: string[];
    };
    propertiesOrder: string[];
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
    propertiesPreview: string[];
    enumPropertiesColors?: Record<string, Record<string, string>>; // { [fieldName]: { [enumOption1]: [color1], [enumOption2]: [color2] } }
    disabled: boolean;
    iconFileId: string | null;
    actions?: string;
    documentTemplatesIds?: string[];
    mapSearchProperties?: string[];
}

export interface IEntityTemplatePopulated extends Omit<IEntityTemplate, 'category'> {
    category: IMongoCategory;
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMongoEntityTemplatePopulated extends IEntityTemplatePopulated {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchBody {
    search?: string;
    limit?: number;
    skip?: number;
}

export interface ISearchEntityTemplatesBody extends ISearchBody {
    ids?: string[];
    categoryIds?: string[];
}

export interface RequestWithSearchEntityTemplateBody extends RequestWithPermissionsOfUserId {
    searchQuery: ISearchEntityTemplatesBody;
}

export class EntityTemplateService extends TemplatesManagerService {
    // categories
    filterCategoriesByPermissions(categories: IMongoCategory[], usersPermissions: ISubCompactPermissions): IMongoCategory[] {
        if (!usersPermissions.instances) {
            return [] as IMongoCategory[];
        }

        return categories.filter(({ _id }) => usersPermissions.instances?.categories[_id]);
    }

    async searchCategories(userPermissions: ISubCompactPermissions, searchInput?: string) {
        const params: Record<string, string> = searchInput ? { search: searchInput } : {};

        const { data: categories } = await this.api.get<IMongoCategory[]>(baseCategoriesRoute, { params });

        return userPermissions.admin ? categories : this.filterCategoriesByPermissions(categories, userPermissions);
    }

    async createCategory(category: ICategory) {
        const { data } = await this.api.post<IMongoCategory>(baseCategoriesRoute, category);

        return data;
    }

    async updateCategory(categoryId: string, updatedCategory: Partial<ICategory>) {
        const { data } = await this.api.put<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`, updatedCategory);

        return data;
    }

    async deleteCategory(categoryId: string) {
        const { data } = await this.api.delete<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    async getCategoryById(categoryId: string) {
        const { data } = await this.api.get<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    // entity templates
    async searchEntityTemplates(userId: string, body: ISearchEntityTemplatesBody = {}) {
        const workspaceId = this.api.defaults.headers[workspaceIdHeaderName]!.toString();
        const usersPermissions = await new Authorizer(workspaceId).getWorkspacePermissions(userId);

        const { data: entityTemplates } = await this.api.post<IMongoEntityTemplatePopulated[]>(`${baseEntitiesRoute}/search`, body);
        return usersPermissions.admin
            ? entityTemplates
            : entityTemplates.filter((entity) => {
                  return (
                      usersPermissions.instances?.categories[entity.category._id]?.scope ||
                      usersPermissions.instances?.categories[entity.category._id]?.entityTemplates[entity._id]
                  );
              });
    }

    async getAllTemplatesByWorkspaceId(workspaceId: string) {
        const { data } = await this.api.get<IMongoEntityTemplate[]>(`${baseRoute}/entities/`, { headers: { workspaceId } });

        return data;
    }

    async getEntityTemplateById(id: string) {
        const { data } = await this.api.get<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    async createEntityTemplate(entityTemplate: IEntityTemplate) {
        const { data } = await this.api.post<IMongoEntityTemplatePopulated>(baseEntitiesRoute, entityTemplate);

        return data;
    }

    async updateEntityTemplate(
        entityTemplateId: string,
        updatedEntityTemplate: Omit<IEntityTemplate, 'disabled'>,
        allowToDeleteRelationshipFields: boolean = true,
    ) {
        const { data } = await this.api.put<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${entityTemplateId}`, {
            ...updatedEntityTemplate,
            allowToDeleteRelationshipFields,
        });

        return data;
    }

    async convertToRelationshipField(entityTemplateId: string, relationshipTemplateId: string, updatedData: Omit<IEntityTemplate, 'disabled'>) {
        const { data } = await this.api.put<{
            updatedRelationShipTemplate: IMongoRelationshipTemplate;
            updatedEntityTemplate: IMongoEntityTemplatePopulated;
        }>(`${baseEntitiesRoute}/convertToRelationshipField/${entityTemplateId}/${relationshipTemplateId}`, updatedData);

        return data;
    }

    async updateEntityTemplateStatus(entityTemplateId: string, disabledStatus: boolean) {
        const { data } = await this.api.patch<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${entityTemplateId}/status`, {
            disabled: disabledStatus,
        });

        return data;
    }

    async deleteEntityTemplate(entityTemplateId: string) {
        const { data } = await this.api.delete<IMongoEntityTemplate>(`${baseEntitiesRoute}/${entityTemplateId}`);

        return data;
    }
}
