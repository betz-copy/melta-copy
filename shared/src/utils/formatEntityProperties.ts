import { IMongoEntityTemplate } from '../interfaces/entityTemplate';
import { CoordinateSystem, locationConverterToString } from './map';

export const formatEntityPropertiesToString = (entityTemplate: IMongoEntityTemplate, properties: Record<string, any>): Record<string, any> => {
    const a = Object.entries(properties).map(([key, value]) => {
        if (!entityTemplate.properties.properties[key]) return [key, value];
        const { format, type, ...restOfProp } = entityTemplate.properties.properties[key];

        switch (format) {
            case 'comment':
                return [key, restOfProp.comment];
            case 'location': {
                const converted = locationConverterToString(value.location, CoordinateSystem.WGS84, value.coordinateSystem);
                return [key, converted];
            }
            case 'relationshipReference':
                const relatedFieldName = entityTemplate.properties.properties[key].relationshipReference?.relatedTemplateField;
                if (relatedFieldName) return [key, value.properties[relatedFieldName]];

                return [key, value];
            case 'user': {
                const parsed = JSON.parse(value);

                return [key, `${parsed.fullName} - ${parsed.hierarchy}`];
            }
            case 'date':
                return [key, new Date(value).toLocaleDateString('he-IL')];
            case 'date-time':
                return [key, new Date(value).toLocaleString('he-IL')];
            default: {
                if (type === 'boolean') return [key, value ? 'כן' : 'לא'];
                if (type === 'array') {
                    if (restOfProp.items?.format === 'user') {
                        return [
                            key,
                            value
                                .map((stringifiedUser: string) => {
                                    const parsed = JSON.parse(stringifiedUser);
                                    return `${parsed.fullName} - ${parsed.hierarchy}`;
                                })
                                .join(', '),
                        ];
                    }

                    return [key, value.join(', ')];
                }

                return [key, value];
            }
        }
    });

    return Object.fromEntries(a);
};
