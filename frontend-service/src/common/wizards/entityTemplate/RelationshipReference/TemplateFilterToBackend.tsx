import { FilterLogicalOperator, IFilterOfField, ISearchFilter } from '@packages/entity';
import { QueryClient } from 'react-query';
import { IEntityTemplateMap } from '../../../../interfaces/template';
import { translateFieldFilter } from '../../../../pages/Graph/GraphFilterToBackend';
import { filterModelToFilterOfTemplatePerField } from '../../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IFilterTemplate } from '../commonInterfaces';

export const filterTemplateToSearchFilter = (
    filterModel: IFilterTemplate[],
    templateId: string,
    queryClient: QueryClient,
    andOr: FilterLogicalOperator = FilterLogicalOperator.AND,
): ISearchFilter | undefined => {
    if (!filterModel.length) return undefined;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId)!;

    const filters = filterModel.map(({ filterProperty, filterField, filterType }) => {
        if (!filterField) return {};
        const propertyTemplate = template.properties.properties[filterProperty];

        return filterModelToFilterOfTemplatePerField(propertyTemplate, filterProperty, filterField, filterType);
    });

    if (andOr === FilterLogicalOperator.AND) return { [FilterLogicalOperator.AND]: filters };
    else return { [FilterLogicalOperator.OR]: filters };
};

export const FilterModelToFilterRecord = (
    filterModel: ISearchFilter | undefined,
    templateId: string,
    queryClient: QueryClient,
    andOr: FilterLogicalOperator = FilterLogicalOperator.AND,
): IFilterTemplate[] => {
    if (!filterModel?.[andOr] || !Array.isArray(filterModel?.[andOr])) return [];

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId)!;

    const fieldFilters = filterModel?.[andOr] as IFilterOfField[];

    return fieldFilters.reduce<IFilterTemplate[]>((acc, filter) => {
        Object.entries(filter).forEach(([field, fieldFilter]) => {
            if (!fieldFilter) return;

            const property = template.properties.properties[field];
            const { filterType, filterField } = translateFieldFilter(fieldFilter, property);

            if (filterField) {
                acc.push({
                    filterProperty: field,
                    filterField,
                    filterType,
                });
            }
        });

        return acc;
    }, []);
};
