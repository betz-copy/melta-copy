import { get } from 'lodash';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { IMongoProcessInstancePopulated, InstanceProperties } from '../../interfaces/processes/processInstance';

export const getAllFieldsTouched = (values: any) => {
    const touched = {};
    Object.keys(values).forEach((field) => {
        touched[field] = true;
    });
    return touched;
};

export const splitFilesProperties = (template: IMongoProcessTemplatePopulated, process: IMongoProcessInstancePopulated, pathToProperties: string) => {
    const templateProperties = get(template, pathToProperties);
    const templateFilesProperties = pickBy(templateProperties, (value) => value.format === 'fileId');
    const templateFileKeys = Object.keys(templateFilesProperties);
    const processProperties = get(process, pathToProperties.split('.')[0]);
    const fieldProperties = pickBy(processProperties, (_value, key) => !templateFileKeys.includes(key)) as InstanceProperties;
    const fileIdsProperties = pickBy(processProperties, (_value, key) => templateFileKeys.includes(key));
    const fileProperties = mapValues(fileIdsProperties, (value) => ({ name: value })) as Record<string, File>;

    return { fieldProperties, fileProperties };
};
