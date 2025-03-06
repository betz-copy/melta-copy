import { IFilterOfField, IFilterOfTemplate, IGraphFilterBody, IGraphFilterBodyBatch, ISearchFilter } from '../../interfaces/entities';
import { getDayEnd, getDayStart } from '../../utils/date';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getFormattedDateAccordingToField } from '../../utils/gantts';
import { numberFilterToFilterOfTemplate, textFilterToFilterOfTemplate } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridFilterModel, IAGGridSetFilter, IAGGridTextFilter } from '../../utils/agGrid/interfaces';

export interface IGraphFilterToBackendBody {
    [templateId: string]: { filter: ISearchFilter } | {};
}

const propertyAndValueRelation = (template: IMongoEntityTemplatePopulated, property: string, filterField: any): Record<string, IFilterOfField> => {
    console.log({ property, filterField });

    const { type, format, enum: propEnum, items } = template.properties.properties[property];
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    };
    // based on the property we will decide if $regex, $in, and such
    if (format === 'date-time' || format === 'date') {
        console.log({ first: filterField[0], second: filterField[1] });

        const paddedStartDate = filterField[0] ? getDayStart(filterField[0]) : undefined;
        const paddedEndDate = filterField[1] ? getDayEnd(filterField[1]) : undefined;
        if (paddedStartDate && paddedEndDate) {
            return {
                [property]: {
                    $gte: getFormattedDateAccordingToField(paddedStartDate, property, template),
                    $lte: getFormattedDateAccordingToField(paddedEndDate, property, template),
                },
            };
        }
        if (paddedStartDate) {
            return { [property]: { $gte: getFormattedDateAccordingToField(paddedStartDate, property, template) } };
        }
        if (paddedEndDate) {
            return { [property]: { $lte: getFormattedDateAccordingToField(paddedEndDate, property, template) } };
        }
        return {};
    }
    if (type === 'number') {
        return numberFilterToFilterOfTemplate(property, { ...filterField, filter: Number(filterField.filter) });
    }
    if (type === 'string') {
        return textFilterToFilterOfTemplate(property, {
            filter: propEnum ? filterField : filterField.filter,
            type: propEnum ? 'contains' : filterField.type,
        });
    }

    if (type === 'array') {
        return { [property]: { $in: filterField } };
    }
    return { [property]: { $eq: filterField } };
};

const backFilterToGraoph = (template: IMongoEntityTemplatePopulated, property: string, fieldFilter: IFilterOfField): IGraphFilterBody => {
    const { type, format } = template.properties.properties[property];
    /// /here to implement all types and format
    if (type === 'string') {
        return textFilterToFilterOfTemplate(property, filterField);
    }
};

export const filterModelToFilterOfGraph = (filterModel: IGraphFilterBodyBatch): IGraphFilterToBackendBody['filters'] => {
    const groupedByTemplate = Object.values(filterModel).reduce((acc: Record<string, Record<string, IFilterOfField>[]>, obj: IGraphFilterBody) => {
        const { selectedTemplate, selectedProperty, filterField } = obj;
        const { _id } = selectedTemplate;

        if (!acc[_id]) {
            // eslint-disable-next-line no-param-reassign
            acc[_id] = [];
        }
        if (selectedProperty && selectedTemplate.properties.properties[selectedProperty].items?.enum && filterField.length > 0) {
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

    console.log({ result });

    return result;
};

function translateBackendFilterToFront(fieldFilter: IFilterOfField): any {
    // Equality operator: $eq
    if (fieldFilter.$eq !== undefined) {
        return { type: 'equals', filter: fieldFilter.$eq };
    }
    // Not-equal operator: $ne
    if (fieldFilter.$ne !== undefined) {
        return { type: 'notEqual', filter: fieldFilter.$ne };
    }
    // Regex operator: $rgx
    if (fieldFilter.$rgx !== undefined) {
        const regexPattern = fieldFilter.$rgx;
        // If the pattern starts and ends with '.*', treat as "contains"
        if (regexPattern.startsWith('.*') && regexPattern.endsWith('.*')) {
            const cleanValue = regexPattern.slice(2, -2);
            return { type: 'contains', filter: cleanValue };
        }
        // If the pattern ends with '.*', treat as "startsWith"
        if (regexPattern.endsWith('.*')) {
            const cleanValue = regexPattern.slice(0, -2);
            return { type: 'startsWith', filter: cleanValue };
        }
        // If the pattern starts with '.*', treat as "endsWith"
        if (regexPattern.startsWith('.*')) {
            const cleanValue = regexPattern.slice(2);
            return { type: 'endsWith', filter: cleanValue };
        }
        // Fallback: treat it as a "contains" filter with the raw regex
        return { type: 'contains', filter: regexPattern };
    }
    // Greater than operator: $gt
    if (fieldFilter.$gt !== undefined) {
        return { type: 'greaterThan', filter: fieldFilter.$gt };
    }
    // Greater than or equal operator: $gte
    if (fieldFilter.$gte !== undefined) {
        return { type: 'greaterThanOrEqual', filter: fieldFilter.$gte };
    }
    // Less than operator: $lt
    if (fieldFilter.$lt !== undefined) {
        return { type: 'lessThan', filter: fieldFilter.$lt };
    }
    // Less than or equal operator: $lte
    if (fieldFilter.$lte !== undefined) {
        return { type: 'lessThanOrEqual', filter: fieldFilter.$lte };
    }
    // Set operator: $in
    if (fieldFilter.$in !== undefined) {
        return { type: 'set', values: fieldFilter.$in };
    }
    // Negation operator: $not (recursively translate inner filter)
    if (fieldFilter.$not !== undefined) {
        return { type: 'not', filter: translateBackendFilterToFront(fieldFilter.$not) };
    }
    // Fallback: return the raw fieldFilter if no recognized operator is found.
    return fieldFilter;
}

export const filterBackendToFilterDocument = (
    filterModel: ISearchFilter | undefined,
    template: IMongoEntityTemplatePopulated,
): IGraphFilterBodyBatch => {
    const parsedFilters: IGraphFilterBodyBatch = {};

    if (!filterModel || !filterModel.$and) return {};
    console.log({ and: filterModel.$and }, typeof filterModel.$and, Array.isArray(filterModel.$and));

    if (Array.isArray(filterModel.$and)) {
        console.log('enter to here');

        filterModel.$and.forEach((filter, index) => {
            console.log({ fvalue: filter });

            Object.entries(filter).forEach(([field, fieldFilter]) => {
                console.log({ field, fieldFilter });

                if (!fieldFilter) return;

                // const fieldTemplate = getFieldTemplate(field);

                // if ('$in' in fieldFilter) addSetFilter(field, fieldFilter.$in as string[]);
                // else if ('$eq' in fieldFilter || '$ne' in fieldFilter) addEqualityFilter(field, fieldFilter, fieldTemplate);
                // else if ('$lt' in fieldFilter || '$lte' in fieldFilter || '$gt' in fieldFilter || '$gte' in fieldFilter)
                //     addRangeFilter(field, fieldFilter, fieldTemplate);
                // else if ('$rgx' in fieldFilter) addRegexFilter(field, fieldFilter.$rgx as string);
                // else if ('$not' in fieldFilter && fieldFilter.$not?.$rgx) addNotContainsFilter(field, fieldFilter.$not.$rgx);

                console.log(Date.now());

                parsedFilters[`${Date.now()}${index}`] = {
                    selectedTemplate: template,

                    selectedProperty: field,
                    filterField: translateBackendFilterToFront(fieldFilter), // todo: function that gets field of backend filter and then translate it to the front by type and format
                };
            });

            // console.log({ myFilter: filter, key: Object.keys(filter)[0], value: Object.values(filter)[0] });
            // parsedFilters[Date.now()] = {
            //     selectedTemplate: template,

            //     selectedProperty: Object.keys(filter)[0],
            // };
        });
    }

    console.log({ parsedFilters });

    return parsedFilters;
};

export const filterBackendToFilterDocument1 = (
    filterOfTemplate: ISearchFilter,
    entityTemplate: IMongoEntityTemplatePopulated,
): IAGGridFilterModel => {
    const filterModel: IAGGridFilterModel = {};

    // Mapping for numeric/date operators.
    const typeMapping: Record<string, IAGGidNumberFilter['type']> = {
        $lt: 'lessThan',
        $lte: 'lessThanOrEqual',
        $gt: 'greaterThan',
        $gte: 'greaterThanOrEqual',
    };

    // Helper: Get the field template from the entity template.
    const getFieldTemplate = (field: string) => entityTemplate.properties.properties[field];

    // Add a "set" filter.
    const addSetFilter = (field: string, values: string[]) => {
        filterModel[field] = {
            filterType: 'set',
            values,
        } as IAGGridSetFilter;
    };

    // Add an equality (or inequality) filter.
    const addEqualityFilter = (field: string, fieldFilter: any, fieldTemplate: any) => {
        const isTextField = fieldTemplate?.format === 'string';
        const value = fieldFilter.$eq ?? fieldFilter.$ne;
        if (value !== undefined) {
            filterModel[field] = {
                filterType: isTextField ? 'text' : 'number',
                type: fieldFilter.$eq !== undefined ? 'equals' : 'notEqual',
                filter: value,
            } as IAGGridTextFilter | IAGGidNumberFilter;
        }
    };

    // Add a range filter for numeric or date fields.
    const addRangeFilter = (field: string, fieldFilter: any, fieldTemplate: any) => {
        const isDateField = ['date', 'datetime'].includes(fieldTemplate?.format);
        Object.entries(typeMapping).forEach(([operator, agType]) => {
            if (fieldFilter[operator] !== undefined) {
                filterModel[field] = {
                    filterType: isDateField ? 'date' : 'number',
                    type: agType,
                    filter: fieldFilter[operator],
                } as IAGGidNumberFilter | IAGGridDateFilter;
            }
        });
    };

    // Add a regex filter. This function cleans the regex pattern and maps it to a text filter type.
    const addRegexFilter = (field: string, regex: string) => {
        const regexPatterns: Record<string, IAGGridTextFilter['type']> = {
            '^.*': 'endsWith',
            '.*$': 'startsWith',
            '^.*$': 'contains',
        };

        // Remove any leading or trailing regex wildcards.
        const cleanRegex = regex.replace(/^[.*]+|[.*]+$/g, '');
        const typeKey = regex.replace(/[^.*^$]/g, '');
        const type = regexPatterns[typeKey] || 'contains';

        filterModel[field] = {
            filterType: 'text',
            type,
            filter: cleanRegex,
        } as IAGGridTextFilter;
    };

    // Add a "not contains" filter.
    const addNotContainsFilter = (field: string, regex: string) => {
        const cleanRegex = regex.replace(/^[.*]+|[.*]+$/g, '');
        filterModel[field] = {
            filterType: 'text',
            type: 'notContains',
            filter: cleanRegex,
        } as IAGGridTextFilter;
    };

    // Process a filter object (of type IFilterOfTemplate) by iterating over its fields.
    const processFilter = (filter: IFilterOfTemplate<any>) => {
        Object.entries(filter).forEach(([field, fieldFilter]) => {
            if (!fieldFilter) return;

            const fieldTemplate = getFieldTemplate(field);

            if ('$in' in fieldFilter) {
                addSetFilter(field, fieldFilter.$in as string[]);
            } else if ('$eq' in fieldFilter || '$ne' in fieldFilter) {
                addEqualityFilter(field, fieldFilter, fieldTemplate);
            } else if ('$lt' in fieldFilter || '$lte' in fieldFilter || '$gt' in fieldFilter || '$gte' in fieldFilter) {
                addRangeFilter(field, fieldFilter, fieldTemplate);
            } else if ('$rgx' in fieldFilter) {
                addRegexFilter(field, fieldFilter.$rgx as string);
            } else if ('$not' in fieldFilter && fieldFilter.$not?.$rgx) {
                addNotContainsFilter(field, fieldFilter.$not.$rgx);
            }
        });
    };

    // Process the $and clause: if it's an array, process each filter; if it's a single object, process it directly.
    if (Array.isArray(filterOfTemplate.$and)) {
        filterOfTemplate.$and.forEach((filter) => processFilter(filter));
    } else if (typeof filterOfTemplate.$and === 'object') {
        processFilter(filterOfTemplate.$and);
    }

    return filterModel;
};
