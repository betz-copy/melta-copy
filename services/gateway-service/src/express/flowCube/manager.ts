import { IFilterOfTemplate } from '@microservices/shared';
import config from '../../config';
import { InstancesService, ISearchEntitiesOfTemplateBodyOptional } from '../../externalServices/instanceService';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import DefaultManagerProxy from '../../utils/express/manager';

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

        let filter: ISearchEntitiesOfTemplateBodyOptional['filter'];
        if (filterAnd.length > 0) {
            filter = { $and: filterAnd };
        }

        return { filter, limit: config.instanceService.searchEntitiesFlowMaxLimit };
    }

    async searchFlowCube(templateId: string, searchBody: Record<string, any>) {
        const convertedSearchBody: ISearchEntitiesOfTemplateBodyOptional = await this.convertFlowToNeoSearch(templateId, searchBody);
        const res = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, convertedSearchBody);
        const convertToFlow = res.entities.map((entity) => entity.entity.properties);
        return convertToFlow;
    }
}
