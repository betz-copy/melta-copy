import { IMongoStepInstancePopulated, IMongoStepTemplatePopulated, InstanceProperties, IReferencedEntityForProcess } from '@packages/process';
import { pickBy } from 'lodash';
import { ProcessStepValues } from './index';

const splitStepProperties = (stepInstance: IMongoStepInstancePopulated, stepTemplate: IMongoStepTemplatePopulated) => {
    const newProperties = {};

    Object.keys(stepTemplate.properties.properties).forEach((key) => {
        if (stepInstance.properties?.[key]) {
            newProperties[key] = stepInstance.properties[key];
        }
    });

    const templateFilesProperties = pickBy(
        stepTemplate.properties.properties,
        (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
    );
    const templateFileKeys = Object.keys(templateFilesProperties);

    const templateEntityProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'entityReference');
    const templateEntityKeys = new Set(Object.keys(templateEntityProperties));

    const entitiesData = pickBy(newProperties, (_value, key) => templateEntityKeys.has(key));
    const properties = pickBy(
        newProperties,
        (_value, key) => !templateFileKeys.includes(key) && !Object.keys(templateEntityProperties).includes(key),
    ) as InstanceProperties;
    const fileIdsProperties = pickBy(newProperties, (_value, key) => templateFileKeys.includes(key));
    Object.entries(fileIdsProperties)?.forEach(([key, value]) => {
        if (Array.isArray(value)) {
            fileIdsProperties[key] = value?.map((item) => {
                if (item !== undefined) return { name: item };
                return undefined;
            });
        } else if (value) {
            fileIdsProperties[key] = { name: value };
        }
    });
    const attachmentsProperties = fileIdsProperties;
    return { properties, attachmentsProperties, entitiesData };
};

export const getStepValuesFromStepInstance = (
    stepInstance: IMongoStepInstancePopulated,
    stepTemplate: IMongoStepTemplatePopulated,
): ProcessStepValues => {
    const { properties, attachmentsProperties, entitiesData } = splitStepProperties(stepInstance, stepTemplate);
    return {
        properties,
        entityReferences: entitiesData as Record<string, IReferencedEntityForProcess>,
        attachmentsProperties,
        status: stepInstance.status,
        comments: stepInstance.comments ?? '',
    };
};
