
import { ICategory, IMongoCategory } from '@packages/category';
import { IChildTemplate, IChildTemplatePopulated, IMongoChildTemplatePopulated } from '@packages/child-template';
import { IEntityTemplate, IMongoEntityTemplate, IMongoEntityTemplatePopulated, ISearchEntityTemplatesBody } from '@packages/entity-template';
import { ISubCompactPermissions } from '@packages/permission';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import { ConfigTypes, ICategoryOrderConfig, IMongoBaseConfig, IMongoCategoryOrderConfig } from '@packages/workspace-configs';
import config from '../../config';
import { Authorizer, RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import TemplatesManagerService from '.';

const {
    service: { workspaceIdHeaderName },
    templateService: {
        baseRoute,
        entities: { baseEntitiesRoute, baseCategoriesRoute, baseChildTemplatesRoute, baseConfigRoute },
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

    async updateEntityTemplateAction(templateId: string, actions: string) {
        const { data } = await this.api.patch<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${templateId}/actions`, { actions });

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

    // configs
    async getConfigs(permissionsOfUserId: ISubCompactPermissions) {
        const { data } = await this.api.get<IMongoBaseConfig[]>(`${baseConfigRoute}/all`);

        // Because in the future the config collection could store different types of configs that might need different permissions,
        // I think the best way to account for that is by checking for each type separately, because config types aren't created by users.
        return data.map((workspaceConfig) => {
            if (workspaceConfig.type === ConfigTypes.CATEGORY_ORDER) {
                const categoryOrder = workspaceConfig as IMongoCategoryOrderConfig;
                return permissionsOfUserId.admin
                    ? categoryOrder
                    : { ...categoryOrder, order: categoryOrder.order.filter((_id) => permissionsOfUserId.instances?.categories[_id]) };
            }

            return workspaceConfig;
        });
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

    // child templates
    async getChildTemplateById(id: string) {
        const { data } = await this.api.get<IMongoChildTemplatePopulated>(`${baseChildTemplatesRoute}/${id}`);
        return data;
    }

    async getAllChildTemplates() {
        const { data } = await this.api.get<IChildTemplatePopulated[]>(`${baseChildTemplatesRoute}`);
        return data;
    }

    async searchChildTemplates(searchBody: {
        search?: string;
        ids?: string[];
        categoryIds?: string[];
        limit?: number;
        skip?: number;
        parentTemplatesIds?: string[];
    }) {
        const { data } = await this.api.post<IChildTemplatePopulated[]>(`${baseChildTemplatesRoute}/search`, searchBody);
        return data;
    }

    async createChildTemplate(childTemplate: IChildTemplate) {
        const { data } = await this.api.post<IChildTemplatePopulated>(`${baseChildTemplatesRoute}`, childTemplate);
        return data;
    }

    async updateChildTemplate(id: string, childTemplate: IChildTemplate) {
        const { data } = await this.api.put<IChildTemplatePopulated>(`${baseChildTemplatesRoute}/${id}`, childTemplate);
        return data;
    }

    async updateChildEntityTemplateAction(templateId: string, actions: string) {
        const { data } = await this.api.patch<IMongoEntityTemplatePopulated>(`${baseChildTemplatesRoute}/${templateId}/actions`, { actions });

        return data;
    }

    async updateChildTemplateStatus(childTemplateId: string, disabledStatus: boolean) {
        const { data } = await this.api.patch<IMongoEntityTemplatePopulated>(`${baseChildTemplatesRoute}/${childTemplateId}/status`, {
            disabled: disabledStatus,
        });

        return data;
    }

    async multiUpdateChildTemplateStatusByParentId(parentId: string, disabledStatus: boolean) {
        const { data } = await this.api.patch<IMongoEntityTemplatePopulated[]>(`${baseChildTemplatesRoute}/${parentId}/multiStatuses`, {
            disabled: disabledStatus,
        });

        return data;
    }
}

export default EntityTemplateService;
