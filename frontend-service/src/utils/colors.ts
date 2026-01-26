import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import randomColor from 'randomcolor';
import { ITemplate } from '../interfaces/template';

export const getEntityTemplateColor = (entityTemplate: ITemplate, categoryColor?: string) => {
    return randomColor({
        hue: categoryColor ?? entityTemplate.category.color,
        seed: entityTemplate.name,
        luminosity: 'bright',
    });
};

export const getRelationshipTemplateColor = (relationshipTemplate: IMongoRelationshipTemplate) => {
    return randomColor({ luminosity: 'dark', seed: relationshipTemplate.name });
};
