import { CoordinateSystem, IEntitySingleProperty, IMongoEntityTemplatePopulated, locationConverterToString } from '@microservices/shared';
import Handlebars from 'handlebars';
import mapValues from 'lodash';

const entityLink = (content: string, baseUrl: string, entityId: string) => {
    return `<a href="${baseUrl}/entity/${entityId}" target="_blank" style="color:#225AA7;font-weight:bold">${Handlebars.escapeExpression(content)}</a>`;
};

const extractStringFromProperty = (
    property: IEntitySingleProperty,
    value: any,
    relatedTemplates?: Map<string, IMongoEntityTemplatePopulated>,
    baseUrl?: string,
    allowLink: boolean = false,
): string => {
    const { format, type, ...restOfProp } = property;
    switch (format) {
        case 'comment':
            return restOfProp.comment || '';
        case 'location': {
            const converted = locationConverterToString(value.location, CoordinateSystem.WGS84, value.coordinateSystem);
            return converted || '';
        }
        case 'relationshipReference': {
            const relatedFieldName = property.relationshipReference!.relatedTemplateField;
            if (relatedTemplates) {
                const relatedTemplate: IMongoEntityTemplatePopulated = relatedTemplates!.get(property.relationshipReference!.relatedTemplateId)!;
                const relatedValue = extractStringFromProperty(
                    relatedTemplate.properties.properties[relatedFieldName],
                    value.properties[relatedFieldName],
                );

                return allowLink && baseUrl ? entityLink(relatedValue, baseUrl, value.properties._id) : relatedValue;
            }

            return allowLink && baseUrl ? entityLink(property.title, baseUrl, value.properties._id) : property.title;
        }
        case 'user': {
            const parsed = JSON.parse(value);

            return `${parsed.fullName} - ${parsed.hierarchy}`;
        }
        case 'date':
            return new Date(value).toLocaleDateString('he-IL');
        case 'date-time':
            return new Date(value).toLocaleString('he-IL');
        default: {
            if (type === 'boolean') return value ? 'כן' : 'לא';
            if (type === 'array') {
                if (restOfProp.items?.format === 'user') {
                    return value
                        .map((stringifiedUser: string) => {
                            const parsed = JSON.parse(stringifiedUser);
                            return `${parsed.fullName} - ${parsed.hierarchy}`;
                        })
                        .join(', ');
                }

                return value.join(', ');
            }

            return value;
        }
    }
};

const formatEntityPropertiesToString = (
    entityTemplate: IMongoEntityTemplatePopulated,
    properties: Record<string, any>,
    relatedTemplates?: Map<string, IMongoEntityTemplatePopulated>,
    baseUrl?: string,
    allowLink: boolean = false,
): Record<string, any> => {
    return mapValues(properties).map((value, key) => {
        const property = entityTemplate.properties.properties[key];
        if (!property) return value;

        const formattedValue = extractStringFromProperty(property, value, relatedTemplates, baseUrl, allowLink);
        const escapedValue = property.format === 'relationshipReference' ? formattedValue : Handlebars.escapeExpression(formattedValue);
        return escapedValue;
    });
};

export default formatEntityPropertiesToString;
