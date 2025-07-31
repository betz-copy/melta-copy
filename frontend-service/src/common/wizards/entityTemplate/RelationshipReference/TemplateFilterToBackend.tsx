import { QueryClient } from 'react-query';
import { ISearchFilter } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { translateFieldFilter } from '../../../../pages/Graph/GraphFilterToBackend';
import { filterModelToFilterOfTemplatePerField } from '../../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IFilterTemplate } from '../commonInterfaces';

export const filterTemplateToSearchFilter = (
    filterModel: IFilterTemplate[],
    templateId: string,
    queryClient: QueryClient,
): ISearchFilter | undefined => {
    console.log({ filterModel });

    if (filterModel.length === 0) return undefined;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId)!;

    const filters = filterModel.map(({ filterProperty, filterField }) => {
        if (!filterField) return {};
        const propertyTemplate = template.properties.properties[filterProperty];

        return filterModelToFilterOfTemplatePerField(propertyTemplate, filterProperty, filterField);
    });

    return {
        $and: filters,
    };
};

export const FilterModelToFilterRecord = (
    filterModel: ISearchFilter | undefined,
    templateId: string,
    queryClient: QueryClient,
): IFilterTemplate[] => {
    if (!filterModel?.$and || !Array.isArray(filterModel.$and)) return [];

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId)!;

    return filterModel.$and.reduce<IFilterTemplate[]>((acc, filter) => {
        Object.entries(filter).forEach(([field, fieldFilter]) => {
            if (!fieldFilter) return;

            const property = template.properties.properties[field];
            const filterField = translateFieldFilter(fieldFilter, property);

            if (filterField) {
                acc.push({
                    filterProperty: field,
                    filterField,
                });
            }
        });
        return acc;
    }, []);
};
