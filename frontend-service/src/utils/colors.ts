import randomColor from 'randomcolor';
import { IEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';
import { IMongoChildTemplatePopulated } from '../interfaces/childTemplates';

export const getEntityTemplateColor = (entityTemplate: IEntityTemplatePopulated | IMongoChildTemplatePopulated) => {
    return randomColor({
        // TODO: [0] is shit
        hue: 'fatherTemplateId' in entityTemplate ? entityTemplate.categories[0].color : entityTemplate.category.color,
        seed: entityTemplate.name,
        luminosity: 'bright',
    });
};

export const getRelationshipTemplateColor = (relationshipTemplate: IMongoRelationshipTemplate) => {
    return randomColor({ luminosity: 'dark', seed: relationshipTemplate.name });
};
