import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import { IFilterOfTemplate, ISearchEntitiesOfTemplateBody } from '../../externalServices/instanceService/interfaces/entities';
import {
    EntityTemplateService,
    IEntitySingleProperty,
    IMongoCategory,
    ISearchEntityTemplatesBody,
} from '../../externalServices/templates/entityTemplateService';
import { UserService } from '../../externalServices/userService';
import { ICompactPermissions, ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { Authorizer } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';
import { escapeRegExp } from '../../utils/regex';
import TemplatesManager from '../templates/manager';
import { IWorkspace } from '../workspaces/interface';
import { WorkspaceService } from '../workspaces/service';
import { FlowFields, FlowParameters, IFlowAutoComplete } from './interfaces';

export class FlowCubeManager extends DefaultManagerProxy<null> {
    private instancesService: InstancesService;

    private entityTemplateService: EntityTemplateService;

    private templatesManager: TemplatesManager;

    private authorizer: Authorizer;

    constructor(workspaceId: string) {
        super(null);

        this.instancesService = new InstancesService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.templatesManager = new TemplatesManager(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
    }

    async convertFlowToNeoSearch(templateId: string, flowSearchBody: Record<string, any>) {
        const filterAnd: IFilterOfTemplate<any>[] = [];
        const template = await this.entityTemplateService.getEntityTemplateById(templateId);

        Object.entries(flowSearchBody).forEach(([field, filterValue]) => {
            if (Array.isArray(filterValue) && filterValue.length === 0) {
                return;
            }

            if (template.properties.properties[field]) {
                const filterCondition = Array.isArray(filterValue)
                    ? { $in: filterValue.map((val) => new RegExp(escapeRegExp(val))) }
                    : { $eq: filterValue };

                filterAnd.push({ [field]: filterCondition });
            } else if (field.endsWith('From') || field.endsWith('To')) {
                const isFrom = field.endsWith('From');
                const originalField = isFrom ? field.slice(0, -4) : field.slice(0, -2);

                const filterValueISOString = `${(filterValue as string).replace(' ', 'T')}Z`;

                const { format } = template.properties.properties[originalField];
                const filterValueFormatted = format === 'date' ? filterValueISOString.slice(0, 10) : filterValueISOString;

                if (isFrom) {
                    filterAnd.push({ [originalField]: { $gte: filterValueFormatted } });
                } else {
                    filterAnd.push({ [originalField]: { $lte: filterValueFormatted } });
                }
            }
        });

        let filter: ISearchEntitiesOfTemplateBody['filter'];
        if (filterAnd.length > 0) {
            filter = { $and: filterAnd };
        }

        return { filter, limit: config.instanceService.searchEntitiesFlowMaxLimit };
    }

    async searchFlowCube(templateId: string, searchBody: Record<string, any>) {
        const convertedSearchBody: ISearchEntitiesOfTemplateBody = await this.convertFlowToNeoSearch(templateId, searchBody);
        const res = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, convertedSearchBody);
        const convertToFlow = res.entities.map((entity) => entity.entity.properties);
        return convertToFlow;
    }

    static async searchWorkspace(body: any, userId: string | undefined) {
        if (!userId) return [];

        const searchBody = {} as { search: string };

        if (body?.Parameters?.Value) {
            searchBody.search = body?.Parameters?.Value;
        }

        const usersPermissions = await UserService.getUserPermissions(userId);
        const workspaces = await WorkspaceService.getWorkspaces(searchBody);
        const filteredWorkspaces = await this.filterWorkspacesByPermissions(workspaces, usersPermissions);

        return filteredWorkspaces.map(({ _id, displayName }) => {
            return { Value: _id, Name: displayName };
        });
    }

    static async filterWorkspacesByPermissions(workspaces: IWorkspace[], usersPermissions: ICompactPermissions): Promise<IWorkspace[]> {
        return (
            await Promise.all(
                workspaces.map(async (workspace) => ({ ...workspace, hierarchyIds: await WorkspaceService.getWorkspaceHierarchyIds(workspace._id) })),
            )
        ).filter(({ hierarchyIds }) => hierarchyIds.some((id) => Boolean(usersPermissions[id])));
    }

    async searchCategory(body: any, userId: string | undefined): Promise<IFlowAutoComplete[]> {
        if (!userId) return [];

        let searchInput = '';

        if (body?.Value) {
            searchInput = body?.Value;
        }

        const usersPermissions = await this.authorizer.getWorkspacePermissions(userId);
        const categories = await this.entityTemplateService.searchCategories(searchInput);
        const filteredCategories = usersPermissions.admin ? categories : this.filterCategoriesByPermissions(categories, usersPermissions);

        return filteredCategories.map(({ _id, displayName }) => {
            return { Value: _id, Name: displayName };
        });
    }

    filterCategoriesByPermissions(categories: IMongoCategory[], usersPermissions: ISubCompactPermissions): IMongoCategory[] {
        if (!usersPermissions.instances) {
            return [] as IMongoCategory[];
        }

        return categories.filter(({ _id }) => usersPermissions.instances?.categories[_id]);
    }

    async searchEntityTemplate(body: any, userId: string | undefined): Promise<IFlowAutoComplete[]> {
        if (!userId) return [];

        const searchEntityTemplatesBody: ISearchEntityTemplatesBody = {};

        if (body?.Value) {
            searchEntityTemplatesBody.search = body.Value;
        }

        if (body?.CategoryType) {
            searchEntityTemplatesBody.categoryIds = [body.CategoryType];
        }

        const usersPermissions = await this.authorizer.getWorkspacePermissions(userId);
        const entityTemplates = await this.templatesManager.searchEntityTemplates(usersPermissions, searchEntityTemplatesBody);
        const userPermissionsByCategory = this.getEntityTemplatesPermissionsByCategory(usersPermissions);
        const allowedEntityTemplates = usersPermissions.admin
            ? entityTemplates
            : entityTemplates.filter(
                  (entityTemplate) =>
                      userPermissionsByCategory[entityTemplate.category._id].length === 0 ||
                      userPermissionsByCategory[entityTemplate.category._id].includes(entityTemplate._id),
              );
        const filteredEntityTemplates = body.CategoryType
            ? allowedEntityTemplates.filter(({ category }) => category._id === body.CategoryType)
            : allowedEntityTemplates;

        return filteredEntityTemplates.map(({ _id, displayName }) => {
            return { Value: _id, Name: displayName };
        });
    }

    getEntityTemplatesPermissionsByCategory(usersPermissions: ISubCompactPermissions): Record<string, string[]> {
        if (!usersPermissions.instances) return {};

        return Object.entries(usersPermissions.instances.categories).reduce(
            (acc, [categoryId, category]) => {
                const templateIds = category.entityTemplates ? Object.keys(category.entityTemplates) : [];
                acc[categoryId] = templateIds;

                return acc;
            },
            {} as Record<string, string[]>,
        );
    }

    async getEntityTemplateById(templateId: string[]): Promise<{ parameters: FlowParameters[]; fields: FlowFields[] }> {
        const template = await this.entityTemplateService.getEntityTemplateById(templateId[0]);
        const { properties } = template;

        const filteredProperties = Object.entries(properties.properties).filter(
            ([_key, value]) => value.format !== 'fileId' && value.format !== 'relationshipReference',
        );

        const additionalFields = this.getAdditionalFields();

        const parameters: FlowParameters[] = [
            ...filteredProperties.map(([key, value]) => ({
                Name: key,
                Type: this.convertTypeToFlowType(value),
                DisplayName: value.title,
                OntologyType: this.getOntologyTypeByProperty(value),
                IsSingleValue: value.uniqueItems ? String(value.uniqueItems) : undefined,
                Options: value.enum ? this.convertArrayToFlowOptions(value.enum) : undefined,
            })),
            ...additionalFields,
        ];

        const fields: FlowFields[] = [
            ...filteredProperties.map(([key, value]) => ({
                Name: key,
                Type: this.convertTypeToFlowType(value),
                DisplayName: value.title,
                OntologyType: this.getOntologyTypeByProperty(value),
            })),
            ...additionalFields,
        ];

        return { parameters, fields };
    }

    private getAdditionalFields(): { Name: string; Type: string; DisplayName: string; OntologyType: string }[] {
        return [
            { Name: 'createdAt', Type: 'DateTime', DisplayName: 'תאריך יצירה', OntologyType: 'TIME' },
            { Name: 'updatedAt', Type: 'DateTime', DisplayName: 'תאריך עדכון', OntologyType: 'TIME' },
        ];
    }

    convertTypeToFlowType(property: IEntitySingleProperty): string {
        let flowType = 'String';

        switch (property.type) {
            case 'string':
                if (property.format === 'date' || property.format === 'date-time') {
                    flowType = 'DateTime';
                } else if (property.format === 'fileId') {
                    flowType = 'File';
                } else {
                    flowType = 'String';
                }
                break;
            case 'number':
                flowType = 'Double';
                break;
            case 'boolean':
                flowType = 'Boolean';
                break;
            default:
                flowType = 'String';
                break;
        }

        return flowType;
    }

    getOntologyTypeByProperty(property: IEntitySingleProperty) {
        let ontologyType = 'TEXT';

        switch (property.type) {
            case 'string':
                if (property.format === 'date' || property.format === 'date-time') {
                    ontologyType = 'TIME';
                } else if (property.format === 'email') {
                    ontologyType = 'EMAIL';
                } else {
                    ontologyType = 'TEXT';
                }

                break;
            case 'number':
                ontologyType = 'INTEGER';

                break;
            default:
                ontologyType = 'TEXT';

                break;
        }

        return ontologyType;
    }

    convertArrayToFlowOptions(arr: string[]) {
        return arr.map((item) => ({
            Name: item,
            Value: item,
        }));
    }

    async searchEntitiesByTemplate(flowParameters: any) {
        const { TemplateType } = flowParameters;
        return this.searchFlowCube(TemplateType, flowParameters);
    }
}
