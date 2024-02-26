import pickBy from 'lodash.pickby';
import { IReferencedEntityForProcess, InstanceProperties } from '../../../../interfaces/processes/processInstance';
import { ProcessStepValues } from './index';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';

const splitStepProperties = (stepInstance: IMongoStepInstancePopulated, stepTemplate: IMongoStepTemplatePopulated) => {
    const newProperties = {};

    Object.keys(stepTemplate.properties.properties).forEach((key) => {
        if (!stepInstance.properties?.[key]) newProperties[key] = undefined;
        else newProperties[key] = stepInstance.properties?.[key];
    });

    const templateFilesProperties = pickBy(
        stepTemplate.properties.properties,
        (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
    );
    console.log(templateFilesProperties);
    const templateFileKeys = Object.keys(templateFilesProperties);

    const templateEntityProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'entityReference');
    const templateEntityKeys = new Set(Object.keys(templateEntityProperties));

    const entitiesData = pickBy(newProperties, (_value, key) => templateEntityKeys.has(key));
    const properties = pickBy(
        newProperties,
        (_value, key) => !templateFileKeys.includes(key) && !Object.keys(templateEntityProperties).includes(key),
    ) as InstanceProperties;
    const fileIdsProperties = pickBy(newProperties, (_value, key) => templateFileKeys.includes(key));
    console.log(fileIdsProperties);
    Object.entries(fileIdsProperties)?.forEach(([key, value]) => {
        if (Array.isArray(value)) {
            fileIdsProperties[key] = value?.map((item) => {
                return { name: item };
            });
        } else {
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
