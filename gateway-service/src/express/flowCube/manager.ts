import { IFilterOfTemplate, ISearchEntitiesOfTemplateBody } from '@packages/entity';
import { ISearchEntityTemplatesBody } from '@packages/entity-template';
import { RelatedPermission } from '@packages/user';
import config from '../../config';
import InstancesService from '../../externalServices/instanceService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import UserService from '../../externalServices/userService';
import { Authorizer } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';
import TemplatesManager from '../templates/manager';
import WorkspaceService from '../workspaces/service';
import { FlowFields, FlowParameters, IFlowAutoComplete } from './interfaces';
import {
    convertArrayToFlowOptions,
    convertTypeToFlowType,
    filterCategoriesByPermissions,
    filterWorkspacesByPermissions,
    getAdditionalFields,
    getEntityTemplatesPermissionsByCategory,
    getOntologyTypeByProperty,
    makeLinkClickable,
} from './utils';

class FlowCubeManager extends DefaultManagerProxy<null> {
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
                const filterCondition = Array.isArray(filterValue) ? { $in: filterValue } : { $eq: filterValue };

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

        return { filter, limit: config.instanceService.searchEntitiesFlowMaxLimit, skip: 0, showRelationships: false, sort: [] };
    }

    async searchFlowCube(workspaceId: string, templateId: string, searchBody: Record<string, any>) {
        const convertedSearchBody: ISearchEntitiesOfTemplateBody = await this.convertFlowToNeoSearch(templateId, searchBody);
        const res = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, convertedSearchBody);
        const workspace = await WorkspaceService.getById(workspaceId);
        const { path, name, type } = workspace;
        const workspacePath = `${path}/${name}${type}`;
        const convertToFlow = res.entities.map((entity) => ({
            meltaLink: makeLinkClickable(`${config.service.meltaBaseUrl}${workspacePath}/entity/${entity.entity.properties._id}`),
            ...entity.entity.properties,
        }));

        return convertToFlow;
    }

    static async searchWorkspace(body: any, userId: string | undefined) {
        if (!userId) return [];

        const searchBody = {} as { search: string };

        if (body?.Parameters?.Value || body?.Value) {
            searchBody.search = body?.Parameters?.Value || body?.Value;
        }

        const usersPermissions = await UserService.getRelatedPermissions(userId, RelatedPermission.User);
        const workspaces = await WorkspaceService.getWorkspaces(searchBody);
        const filteredWorkspaces = await filterWorkspacesByPermissions(workspaces, usersPermissions);

        return filteredWorkspaces
            .filter(({ metadata }) => metadata?.flowCube)
            .map(({ _id, displayName }) => {
                return { Value: _id, Name: displayName };
            });
    }

    async searchCategory(body: any, userId: string | undefined): Promise<IFlowAutoComplete[]> {
        if (!userId) return [];

        let searchInput = '';

        if (body?.Value) {
            searchInput = body?.Value;
        }

        const usersPermissions = await this.authorizer.getWorkspacePermissions(userId);
        const categories = await this.entityTemplateService.searchCategories(usersPermissions, searchInput);
        const filteredCategories = usersPermissions.admin ? categories : filterCategoriesByPermissions(categories, usersPermissions);

        return filteredCategories.map(({ _id, displayName }) => {
            return { Value: _id, Name: displayName };
        });
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
        const entityTemplates = await this.templatesManager.searchEntityTemplates(usersPermissions, searchEntityTemplatesBody, userId);
        const userPermissionsByCategory = getEntityTemplatesPermissionsByCategory(usersPermissions);
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

    async getEntityTemplateById(templateId: string[]): Promise<{ parameters: FlowParameters[]; fields: FlowFields[] }> {
        const template = await this.entityTemplateService.getEntityTemplateById(templateId[0]);
        const { properties } = template;

        const filteredProperties = Object.entries(properties.properties).filter(
            ([_key, value]) => value.format !== 'fileId' && value.format !== 'relationshipReference',
        );

        const additionalFields = getAdditionalFields();
        const [firstAdditionalField, ...restAdditionalFields] = additionalFields;

        const parameters: FlowParameters[] = [
            firstAdditionalField,
            ...filteredProperties.map(([key, value]) => ({
                Name: key,
                Type: convertTypeToFlowType(value),
                DisplayName: value.title,
                OntologyType: getOntologyTypeByProperty(value),
                IsSingleValue: value.uniqueItems ? String(value.uniqueItems) : undefined,
                Options: value.enum ? convertArrayToFlowOptions(value.enum) : undefined,
            })),
            ...restAdditionalFields,
        ];

        const fields: FlowFields[] = [
            firstAdditionalField,
            ...filteredProperties.map(([key, value]) => ({
                Name: key,
                Type: convertTypeToFlowType(value),
                DisplayName: value.title,
                OntologyType: getOntologyTypeByProperty(value),
            })),
            ...restAdditionalFields,
        ];

        return { parameters, fields };
    }

    async searchEntitiesByTemplate(flowParameters: any) {
        const { TemplateType, WorkspaceId } = flowParameters;
        return this.searchFlowCube(WorkspaceId, TemplateType, flowParameters);
    }
}

export default FlowCubeManager;
