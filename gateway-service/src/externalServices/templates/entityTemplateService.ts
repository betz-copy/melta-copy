import {
    ICategory,
    IMongoCategory,
    IEntityTemplate,
    IMongoEntityTemplate,
    IMongoEntityTemplatePopulated,
    ISearchEntityTemplatesBody,
    IMongoRelationshipTemplate,
    ISubCompactPermissions,
    IMongoCategoryOrderConfig,
    IMongoBaseConfig,
    ConfigTypes,
    ICategoryOrderConfig,
} from '@microservices/shared';
import TemplatesManagerService from '.';
import config from '../../config';
import { Authorizer, RequestWithPermissionsOfUserId } from '../../utils/authorizer';

const {
    service: { workspaceIdHeaderName },
    templateService: {
        baseRoute,
        entities: { baseEntitiesRoute, baseCategoriesRoute, baseConfigRoute },
    },
} = config;

export interface RequestWithSearchEntityTemplateBody extends RequestWithPermissionsOfUserId {
    searchQuery: ISearchEntityTemplatesBody;
}

class EntityTemplateService extends TemplatesManagerService {
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

    async updateCategoryTemplatesOrder(templateId: string, newIndex: number, srcCategoryId: string, newCategoryId: string) {
        const { data } = await this.api.patch<{ oldCategory: IMongoCategory; newCategory: IMongoCategory }>(
            `${baseCategoriesRoute}/templatesOrder/${templateId}`,
            {
                newIndex,
                srcCategoryId,
                newCategoryId,
            },
        );

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

    // config
    async getConfigs(configName?: string) {
        const { data } = await this.api.get<IMongoBaseConfig[]>(`${baseConfigRoute}/all`, { params: { configName } });

        return data;
    }

    async getConfigByType(type: ConfigTypes, permissionsOfUserId: ISubCompactPermissions) {
        const { data } = await this.api.get<IMongoBaseConfig>(`${baseConfigRoute}/${type}`);

        if (type === ConfigTypes.CATEGORY_ORDER) {
            const categoryOrder = data as IMongoCategoryOrderConfig;
            return permissionsOfUserId.admin
                ? categoryOrder
                : { ...categoryOrder, order: categoryOrder.order.filter((_id) => permissionsOfUserId.instances?.categories[_id]) };
        }

        return data;
    }

    async updateOrderConfig(configId: string, newIndex: number, item: string) {
        const { data } = await this.api.put<IMongoCategoryOrderConfig>(`${baseConfigRoute}/${ConfigTypes.CATEGORY_ORDER}/${configId}`, {
            newIndex,
            item,
        });

        return data;
    }

    async createOrderConfig(configData: ICategoryOrderConfig) {
        const { data } = await this.api.post<IMongoCategoryOrderConfig>(`${baseConfigRoute}/${ConfigTypes.CATEGORY_ORDER}`, configData);

        return data;
    }
}

export default EntityTemplateService;
