import { get } from 'lodash';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { IMongoProcessInstancePopulated, InstanceProperties } from '../../interfaces/processes/processInstance';
import { ProcessDetailsValues } from '../../common/wizards/processInstance/ProcessDetails';

export const getAllFieldsTouched = (values: ProcessDetailsValues) => {
    const touched = {};
    Object.entries(values).forEach(([field, value]) => {
        if (value && typeof value === 'object') touched[field] = getAllFieldsTouched(value);
        else touched[field] = true;
    });
    return touched;
};

export const splitSpacialProperties = (
    template: IMongoProcessTemplatePopulated,
    process: IMongoProcessInstancePopulated,
    pathToProperties: string,
) => {
    const templateProperties = get(template, pathToProperties);
    const templateEntityProperties = pickBy(templateProperties, (value) => value.format === 'entityReference');
    const templateFilesProperties = pickBy(templateProperties, (value) => value.format === 'fileId');
    const templateFileKeys = new Set(Object.keys(templateFilesProperties));
    const templateEntityKeys = new Set(Object.keys(templateEntityProperties));
    const processProperties = get(process, pathToProperties.split('.')[0]);
    const fieldProperties = pickBy(
        processProperties,
        (_value, key) => !templateFileKeys.has(key) && !templateEntityKeys.has(key),
    ) as InstanceProperties;
    const fileIdsProperties = pickBy(processProperties, (_value, key) => templateFileKeys.has(key));
    const entityProperties = pickBy(processProperties, (_value, key) => templateEntityKeys.has(key));
    const fileProperties = mapValues(fileIdsProperties, (value) => ({ name: value })) as Record<string, File>;

    return { fieldProperties, fileProperties, entityProperties };
};
