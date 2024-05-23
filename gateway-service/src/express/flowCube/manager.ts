import config from '../../config';
import { EntityTemplateManagerService } from '../../externalServices/entityTemplateService';
import { InstanceManagerService } from '../../externalServices/instanceService';
import { IFilterOfTemplate, ISearchEntitiesOfTemplateBody } from '../../externalServices/instanceService/interfaces/entities';

export class FlowCubeManager {
    static async convertFlowToNeoSearch(templateId: string, flowSearchBody: Record<string, any>) {
        const filterAnd: IFilterOfTemplate<any>[] = [];
        const template = await EntityTemplateManagerService.getEntityTemplateById(templateId);

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

    static async searchFlowCube(templateId: string, searchBody: any) {
        const convertedSearchBody: ISearchEntitiesOfTemplateBody = await FlowCubeManager.convertFlowToNeoSearch(templateId, searchBody);
        const res = await InstanceManagerService.searchEntitiesOfTemplateRequest(templateId, convertedSearchBody);
        const convertToFlow = res.entities.map((entity) => entity.entity.properties);
        return convertToFlow;
    }
}
