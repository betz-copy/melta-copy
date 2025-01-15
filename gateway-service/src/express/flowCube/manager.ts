import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import { IFilterOfTemplate, ISearchEntitiesOfTemplateBody } from '../../externalServices/instanceService/interfaces/entities';
import { EntityTemplateService, IEntitySingleProperty, ISearchEntityTemplatesBody } from '../../externalServices/templates/entityTemplateService';
import DefaultManagerProxy from '../../utils/express/manager';
import { FlowFields, FlowParameters, TemplateNamesAndId } from './interfaces';

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
            if (Array.isArray(filterValue) && filterValue.length === 0) {
                return;
            }

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

    async searchTemplatesNameAndIdInWorkspace(body: any): Promise<TemplateNamesAndId[]> {
        let searchEntityTemplatesBody = {};
        if (body?.Parameters?.Value) {
            searchEntityTemplatesBody = { search: body.Parameters.Value };
        }

        const templates = await this.entityTemplateService.searchEntityTemplates(searchEntityTemplatesBody as ISearchEntityTemplatesBody);

        return templates.map(({ _id, displayName }) => {
            return { Value: _id, Name: displayName };
        });
    }

    async getEntityTemplateById(templateId: string[]): Promise<{ parameters: FlowParameters[]; fields: FlowFields[] }> {
        const template = await this.entityTemplateService.getEntityTemplateById(templateId[0]);
        const { properties } = template;

        const filteredProperties = Object.entries(properties.properties).filter(
            ([_key, value]) => value.format !== 'fileId' && value.format !== 'relationshipReference',
        );

        const additionalFields = [
            {
                Name: 'createdAt',
                Type: 'DateTime',
                DisplayName: 'תאריך יצירה',
                OntologyType: 'DateTime',
            },
            {
                Name: 'updatedAt',
                Type: 'DateTime',
                DisplayName: 'תאריך עדכון',
                OntologyType: 'DateTime',
            },
        ];

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
