import pickBy from 'lodash.pickby';
import mapValues from 'lodash.mapvalues';
import { InstanceProperties } from '../../../../interfaces/processes/processInstance';
import { ProcessStepValues } from './index';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';

const splitStepProperties = (stepInstance: IMongoStepInstancePopulated, stepTemplate: IMongoStepTemplatePopulated) => {
    const templateFilesProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'fileId');
    const templateFileKeys = Object.keys(templateFilesProperties);

    const properties = pickBy(stepInstance.properties, (_value, key) => !templateFileKeys.includes(key)) as InstanceProperties;
    const fileIdsProperties = pickBy(stepInstance.properties, (_value, key) => templateFileKeys.includes(key));
    const attachmentsProperties = mapValues(fileIdsProperties, (value) => ({ name: value })) as Record<string, File>;
    return { properties, attachmentsProperties };
};

export const getStepValuesFromStepInstance = (
    stepInstance: IMongoStepInstancePopulated,
    stepTemplate: IMongoStepTemplatePopulated,
): ProcessStepValues => {
    const { properties, attachmentsProperties } = splitStepProperties(stepInstance, stepTemplate);
    return {
        properties,
        attachmentsProperties,
        status: stepInstance.status,
    };
};
