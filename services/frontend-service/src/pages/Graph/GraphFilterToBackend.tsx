import { IFilterOfField, IGraphFilterBody, IGraphFilterBodyBatch, IMongoEntityTemplatePopulated, ISearchFilter } from '@microservices/shared';
import { getDayEnd, getDayStart } from '../../utils/date';
import { getFormattedDateAccordingToField } from '../../utils/gantts';

export interface IGraphFilterToBackendBody {
    [templateId: string]: { filter: ISearchFilter } | {};
}

const propertyAndValueRelation = (template: IMongoEntityTemplatePopulated, property: string, filterField: any): Record<string, IFilterOfField> => {
    const { type, format } = template.properties.properties[property];
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    };
    // based on the property we will decide if $regex, $in, and such
    if (format === 'date-time' || format === 'date') {
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
        return { [property]: { $eq: Number(filterField) } };
    }
    if (type === 'string') {
        return { [property]: { $rgx: `.*${escapeRegExp(filterField!)}.*` } };
    }
    if (type === 'array') {
        return { [property]: { $in: filterField } };
    }
    return { [property]: { $eq: filterField } };
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
    return result;
};
