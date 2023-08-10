import pickBy from 'lodash.pickby';
import mapValues from 'lodash.mapvalues';
import { InstanceProperties } from '../../../../interfaces/processes/processInstance';
import { ProcessStepValues } from './index';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';

const splitStepProperties = (stepInstance: IMongoStepInstancePopulated, stepTemplate: IMongoStepTemplatePopulated) => {
    const templateFilesProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'fileId');
    const templateFileKeys = Object.keys(templateFilesProperties);

    const templateEntityProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'entityReference');
    const templateEntityKeys = new Set(Object.keys(templateEntityProperties));

    const entitiesData = pickBy(stepInstance.properties, (_value, key) => templateEntityKeys.has(key));
    const properties = pickBy(
        stepInstance.properties,
        (_value, key) => !templateFileKeys.includes(key) && !Object.keys(templateEntityProperties).includes(key),
    ) as InstanceProperties;
    const fileIdsProperties = pickBy(stepInstance.properties, (_value, key) => templateFileKeys.includes(key));
    const attachmentsProperties = mapValues(fileIdsProperties, (value) => ({ name: value })) as Record<string, File>;
    return { properties, attachmentsProperties, entitiesData };
};

export const getStepValuesFromStepInstance = (
    stepInstance: IMongoStepInstancePopulated,
    stepTemplate: IMongoStepTemplatePopulated,
): ProcessStepValues => {
    const { properties, attachmentsProperties, entitiesData } = splitStepProperties(stepInstance, stepTemplate);
    return {
        properties,
        entityReferences: entitiesData,
        attachmentsProperties,
        status: stepInstance.status,
        comments: stepInstance.comments?? '',
    };
};
