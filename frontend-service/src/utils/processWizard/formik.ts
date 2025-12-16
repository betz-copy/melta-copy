import { IMongoProcessInstanceReviewerPopulated, IMongoProcessTemplateReviewerPopulated, InstanceProperties } from '@microservices/shared';
import { get } from 'lodash';
import pickBy from 'lodash.pickby';
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
    template: IMongoProcessTemplateReviewerPopulated,
    process: IMongoProcessInstanceReviewerPopulated,
    pathToProperties: string,
) => {
    const templateProperties = get(template, pathToProperties);
    const templateEntityProperties = pickBy(templateProperties, (value) => value.format === 'entityReference');
    const templateFilesProperties = pickBy(templateProperties, (value) => value.format === 'fileId' || value.items?.format === 'fileId');
    const templateFileKeys = new Set(Object.keys(templateFilesProperties));
    const templateEntityKeys = new Set(Object.keys(templateEntityProperties));
    const processProperties = get(process, pathToProperties.split('.')[0]);
    const fieldProperties = pickBy(
        processProperties,
        (_value, key) => !templateFileKeys.has(key) && !templateEntityKeys.has(key),
    ) as InstanceProperties;
    const fileIdsProperties = pickBy(processProperties, (_value, key) => templateFileKeys.has(key));
    const entityProperties = pickBy(processProperties, (_value, key) => templateEntityKeys.has(key));
    Object.entries(fileIdsProperties).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            fileIdsProperties[key] = value?.map((item) => {
                return { name: item };
            });
        } else {
            fileIdsProperties[key] = { name: value };
        }
    });
    const fileProperties = fileIdsProperties;
    return { fieldProperties, fileProperties, entityProperties };
};
