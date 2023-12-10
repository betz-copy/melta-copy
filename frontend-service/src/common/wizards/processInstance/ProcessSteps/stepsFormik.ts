import pickBy from 'lodash.pickby';
import mapValues from 'lodash.mapvalues';
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

    const templateFilesProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'fileId');
    const templateFileKeys = Object.keys(templateFilesProperties);

    const templateEntityProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'entityReference');
    const templateEntityKeys = new Set(Object.keys(templateEntityProperties));

    const entitiesData = pickBy(newProperties, (_value, key) => templateEntityKeys.has(key));
    const properties = pickBy(
        newProperties,
        (_value, key) => !templateFileKeys.includes(key) && !Object.keys(templateEntityProperties).includes(key),
    ) as InstanceProperties;
    const fileIdsProperties = pickBy(newProperties, (_value, key) => templateFileKeys.includes(key));
    const attachmentsProperties = mapValues(fileIdsProperties, (value) => (value ? { name: value } : undefined)) as Record<string, File>;
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
