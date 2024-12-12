import { formatToString } from '../common/EntityProperties';
import { IEntity } from '../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

export const getTopNFieldsWithValues = (entity: IEntity, entityTemplate: IMongoEntityTemplatePopulated, n: number) => {
    const { propertiesOrder } = entityTemplate;
    const results: string[] = [];
    propertiesOrder.forEach((field) => {
        if (entity.properties[field])
            results.push(formatToString(entity.properties[field], entityTemplate.properties.properties[field], { pureString: true }));
    });

    return results.slice(0, results.length >= n ? n : results.length);
};
