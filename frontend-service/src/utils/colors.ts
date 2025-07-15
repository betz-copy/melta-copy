import randomColor from 'randomcolor';
import { IEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';
import { IMongoChildTemplatePopulated } from '../interfaces/childTemplates';

export const getEntityTemplateColor = (entityTemplate: IEntityTemplatePopulated | IMongoChildTemplatePopulated) => {
    return randomColor({
        hue: entityTemplate.category.color,
        seed: entityTemplate.name,
        luminosity: 'bright',
    });
};

export const getRelationshipTemplateColor = (relationshipTemplate: IMongoRelationshipTemplate) => {
    return randomColor({ luminosity: 'dark', seed: relationshipTemplate.name });
};
