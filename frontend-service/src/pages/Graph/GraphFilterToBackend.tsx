import { IFilterOfField, IFilterOfTemplate, IGraphFilterBody, IGraphFilterBodyBatch, ISearchFilter } from '../../interfaces/entities';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import {
    dateFilterToFilterOfTemplate,
    dateTimeFilterToFilterOfTemplate,
    numberFilterToFilterOfTemplate,
    setFilterToFilterOfTemplate,
    textFilterToFilterOfTemplate,
} from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IAGGridSetFilter } from '../../utils/agGrid/interfaces';

export interface IGraphFilterToBackendBody {
    [templateId: string]: { filter: ISearchFilter } | {};
}

const propertyAndValueRelation = (
    template: IMongoEntityTemplatePopulated,
    property: string,
    filterField: IGraphFilterBody['filterField'],
): IFilterOfTemplate => {
    const { type, format, enum: propEnum } = template.properties.properties[property];

    if (format === 'date-time' || format === 'date') {
        if (format === 'date') {
            return dateFilterToFilterOfTemplate(property, { type: filterField.type, dateFrom: filterField.filter[0], dateTo: filterField.filter[1] });
        }
        return dateTimeFilterToFilterOfTemplate(property, { type: filterField.type, dateFrom: filterField[0], dateTo: filterField[1] });
    }
    if (type === 'number') {
        return numberFilterToFilterOfTemplate(property, { ...filterField, filter: Number(filterField.filter) });
    }
    if (type === 'string') {
        return textFilterToFilterOfTemplate(property, {
            filter: propEnum ? filterField : filterField.filter,
            type: propEnum ? 'equals' : filterField.type,
        });
    }

    if (type === 'array') {
        return setFilterToFilterOfTemplate(property, filterField);
    }
    return { [property]: { $eq: filterField } };
};

export const filterModelToFilterOfGraph = (filterModel: IGraphFilterBodyBatch): IGraphFilterToBackendBody['filters'] => {
    const groupedByTemplate = Object.values(filterModel).reduce((acc: Record<string, IFilterOfTemplate[]>, obj: IGraphFilterBody) => {
        const { selectedTemplate, selectedProperty, filterField } = obj;
        const { _id } = selectedTemplate;

        if (!acc[_id]) {
            // eslint-disable-next-line no-param-reassign
            acc[_id] = [];
        }
        if (
            selectedProperty &&
            selectedTemplate.properties.properties[selectedProperty].items?.enum &&
            (filterField as IAGGridSetFilter).values.length > 0
        ) {
            acc[_id].push(propertyAndValueRelation(selectedTemplate, selectedProperty, filterField));
        } else if (selectedProperty) acc[_id].push(propertyAndValueRelation(selectedTemplate, selectedProperty, filterField));
        else acc[_id].push({});
        return acc;
    }, {} as Record<string, Record<string, IFilterOfField>[]>);
    const result = Object.keys(groupedByTemplate).reduce((finalObj: Record<string, IGraphFilterToBackendBody['filters']>, template: string) => {
        // eslint-disable-next-line no-param-reassign
        finalObj[template] = {
            filter: {
                $and: groupedByTemplate[template],
            },
        };
        return finalObj;
    }, {});
    return result;
};

function translateFilterField(fieldFilter: IFilterOfField, property: IEntitySingleProperty) {
    const filterMap: Record<string, (value: any) => any> = {
        $eq: (value) => (property.enum || typeof value === 'boolean' ? value : { type: 'equals', filter: value }),
        $ne: (value) => ({ type: 'notEqual', filter: value }),
        $gt: (value) => ({ type: 'greaterThan', filter: value }),
        $gte: (value) => ({ type: 'greaterThanOrEqual', filter: value }),
        $lt: (value) => ({ type: 'lessThan', filter: value }),
        $lte: (value) => ({ type: 'lessThanOrEqual', filter: value }),
        $in: (value) => value,
        $not: (value) => ({ type: 'not', filter: translateFilterField(value, property) }),
        $rgx: (value) => {
            if (value.startsWith('.*') && value.endsWith('.*')) return { type: 'contains', filter: value.slice(2, -2) };
            if (value.endsWith('.*')) return { type: 'startsWith', filter: value.slice(0, -2) };
            if (value.startsWith('.*')) return { type: 'endsWith', filter: value.slice(2) };
            return { type: 'contains', filter: value };
        },
    };

    for (const [key, value] of Object.entries(fieldFilter)) {
        if (filterMap[key]) return filterMap[key](value);
    }

    return fieldFilter;
}

export const FilterOfGraphToFilterRecord = (
    filterModel: ISearchFilter | undefined,
    template: IMongoEntityTemplatePopulated,
): IGraphFilterBodyBatch => {
    const parsedFilters: IGraphFilterBodyBatch = {};

    if (!filterModel || !filterModel.$and) return {};

    if (Array.isArray(filterModel.$and)) {
        filterModel.$and.forEach((filter, index) => {
            Object.entries(filter).forEach(([field, fieldFilter]) => {
                if (!fieldFilter) return;

                parsedFilters[`${Date.now()}${index}`] = {
                    selectedTemplate: template,
                    selectedProperty: field,
                    filterField: translateFilterField(fieldFilter, template.properties.properties[field]),
                };
            });
        });
    }

    return parsedFilters;
};
