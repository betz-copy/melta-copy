import randomColor from 'randomcolor';
import { IEntityTemplatePopulated, IMongoRelationshipTemplate } from '@microservices/shared';

export const getEntityTemplateColor = (entityTemplate: IEntityTemplatePopulated) => {
    return randomColor({ hue: entityTemplate.category.color, seed: entityTemplate.name, luminosity: 'bright' });
};

export const getRelationshipTemplateColor = (relationshipTemplate: IMongoRelationshipTemplate) => {
    return randomColor({ luminosity: 'dark', seed: relationshipTemplate.name });
};
