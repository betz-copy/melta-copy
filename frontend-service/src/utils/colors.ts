import { IMongoEntityTemplateWithConstraintsPopulated, IMongoRelationshipTemplate } from '@microservices/shared';
import randomColor from 'randomcolor';

export const getEntityTemplateColor = (entityTemplate: IMongoEntityTemplateWithConstraintsPopulated, categoryColor?: string) => {
    return randomColor({
        hue: categoryColor ?? entityTemplate.category.color,
        seed: entityTemplate.name,
        luminosity: 'bright',
    });
};

export const getRelationshipTemplateColor = (relationshipTemplate: IMongoRelationshipTemplate) => {
    return randomColor({ luminosity: 'dark', seed: relationshipTemplate.name });
};
