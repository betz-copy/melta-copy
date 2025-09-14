import Handlebars from 'handlebars';
import { CoordinateSystem, IMongoEntityTemplate, locationConverterToString } from '@microservices/shared';

export const formatEntityProperties = (entityTemplate: IMongoEntityTemplate, properties: Record<string, any>): Record<string, any> => {
    const a = Object.entries(properties).map(([key, value]) => {
        if (!entityTemplate.properties.properties[key]) return [key, value];
        const { format, type, ...restOfProp } = entityTemplate.properties.properties[key];

        switch (format) {
            case 'comment':
                return [key, restOfProp.comment];
            case 'location':
                const converted = locationConverterToString(value.location, CoordinateSystem.WGS84, value.coordinateSystem);
                return [key, converted];
            case 'relationshipReference':
                return [key, value];
            case 'user':
                if (type === 'array') {
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

                const parsed = JSON.parse(value);

                return [key, `${parsed.fullName} - ${parsed.hierarchy}`];
            default:
                if (type === 'boolean') return [key, value ? 'כן' : 'לא'];
                if (type === 'array') return [key, value.join(', ')];

                return [key, value];
        }
    });

    return Object.fromEntries(a);
};

export const injectValuesToString = (template: string, properties: Record<string, any>, entityTemplate: IMongoEntityTemplate) => {
    const compiledTemplate = Handlebars.compile(template);
    const formatted = formatEntityProperties(entityTemplate, properties);
    const injected = compiledTemplate(formatted);

    return injected;
};
