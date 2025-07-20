import randomColor from 'randomcolor';
import { IMongoChildTemplatePopulated } from '../interfaces/childTemplates';
import { IEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';

export const getEntityTemplateColor = (entityTemplate: IEntityTemplatePopulated | IMongoChildTemplatePopulated, categoryColor?: string) => {
    return randomColor({
        hue: categoryColor ?? entityTemplate.category.color,
        seed: entityTemplate.name,
        luminosity: 'bright',
    });
};

export const getRelationshipTemplateColor = (relationshipTemplate: IMongoRelationshipTemplate) => {
    return randomColor({ luminosity: 'dark', seed: relationshipTemplate.name });
};
