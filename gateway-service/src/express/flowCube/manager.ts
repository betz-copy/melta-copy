import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import { IFilterOfTemplate, ISearchEntitiesOfTemplateBody } from '../../externalServices/instanceService/interfaces/entities';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import DefaultManagerProxy from '../../utils/express/manager';
import { FlowField, FlowParameter, TemplateNamesAndId } from './interfaces';

export class FlowCubeManager extends DefaultManagerProxy<null> {
    private instancesService: InstancesService;

    private entityTemplateService: EntityTemplateService;

    constructor(workspaceId: string) {
        super(null);

        this.instancesService = new InstancesService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
    }

    async convertFlowToNeoSearch(templateId: string, flowSearchBody: Record<string, any>) {
        const filterAnd: IFilterOfTemplate<any>[] = [];
        const template = await this.entityTemplateService.getEntityTemplateById(templateId);

        Object.entries(flowSearchBody).forEach(([field, filterValue]) => {
            if (template.properties.properties[field]) {
                if (Array.isArray(filterValue)) {
                    filterAnd.push({ [field]: { $in: filterValue } });
                } else {
                    filterAnd.push({ [field]: { $eq: filterValue } });
                }
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

    async getAllTemplatesNameAndIdByWorkspaceId(workspaceId: string): Promise<TemplateNamesAndId[]> {
        const templates = await this.entityTemplateService.getAllTemplatesByWorkspaceId(workspaceId);

        return templates.map(({ _id, displayName }) => {
            return { Value: displayName, Name: _id };
        });
    }

    async getEntityTemplateById(templateId: string): Promise<{ PARAMETERS: FlowParameter[]; FIELDS: FlowField[] }> {
        const template = await this.entityTemplateService.getEntityTemplateById(templateId);
        const { properties } = template;

        const parameters: FlowParameter[] = Object.entries(properties.properties).map(([key, value]) => ({
            Name: key,
            $name: value.type as string,
            ColumnName: key,
            isRequired: false,
            DisplayName: value.title,
            Description: value.title,
            IsSingleValue: !!value.uniqueItems,
            Options: [] as Array<any>,
            IsContains: false,
        }));

        const fields: FlowField[] = Object.entries(properties.properties).map(([key, value]) => ({
            $name: key,
            Name: key,
            DisplayName: value.title,
            Type: value.type as string,
        }));

        return { PARAMETERS: parameters, FIELDS: fields };
    }
}
