import randomColor from 'randomcolor';
import { IEntityTemplateMap, IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';

export const getEntityTemplateColor = (entityTemplate: IEntityTemplatePopulated) => {
    return randomColor({ hue: entityTemplate.category.color, seed: entityTemplate.name, luminosity: 'bright' });
};

export const getRelationshipTemplateColor = (relationshipTemplate: IMongoRelationshipTemplate) => {
    return randomColor({ luminosity: 'dark', seed: relationshipTemplate.name });
};

export const getRelationshipRefColor = (template: IMongoEntityTemplatePopulated, entityTemplates: IEntityTemplateMap) => {
    const colorMap = new Map<string, string>();
    Object.values(template.properties.properties).forEach((value) => {
        if (value.format === 'relationshipReference') {
            const { relatedTemplateId } = value.relationshipReference!;
            const relatedEntityTemplate = entityTemplates.get(relatedTemplateId);

            if (relatedEntityTemplate) {
                const entityTemplateColor = getEntityTemplateColor(relatedEntityTemplate);
                colorMap[relatedTemplateId] = entityTemplateColor;
            }
        }
    });

    return colorMap;
};
