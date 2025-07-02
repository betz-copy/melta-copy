import { IEntityChildTemplatePopulated, IFilterOfTemplate, ISearchFilter } from '@microservices/shared';

const getFilterFromChildTemplate = (childTemplate: IEntityChildTemplatePopulated): ISearchFilter => {
    return Object.entries(childTemplate.properties ?? {}).reduce<{ $and: IFilterOfTemplate<Record<string, any>>[] }>(
        (acc, [key, prop]) => {
            if (!prop.filters) return acc;

            const parsedFilters: ISearchFilter<Record<string, any>> = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;

            if (Array.isArray(parsedFilters.$and)) {
                const transformedFilters = parsedFilters.$and
                    .map((filter) => {
                        const fieldFilter = filter[key];
                        return fieldFilter ? { [key]: fieldFilter } : null;
                    })
                    .filter(Boolean) as IFilterOfTemplate<Record<string, any>>[];

                acc.$and.push(...transformedFilters);
            } else {
                acc.$and.push({ [key]: parsedFilters } as IFilterOfTemplate<Record<string, any>>);
            }

            return acc;
        },
        { $and: [{ disabled: { $eq: false } }] },
    );
};

export default getFilterFromChildTemplate;
