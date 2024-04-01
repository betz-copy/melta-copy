/* eslint-disable no-param-reassign */
import mapValues from 'lodash.mapvalues';
import { IMongoStepInstancePopulated } from '../interfaces/processes/stepInstance';
import axios from '../axios';
import { ProcessDetailsValues } from '../common/wizards/processInstance/ProcessDetails';
import { environment } from '../globals';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, ISearchProcessInstancesBody } from '../interfaces/processes/processInstance';
import { ProcessStepValues } from '../common/wizards/processInstance/ProcessSteps';

const { processes } = environment.api;
export const getProcessByIdRequest = async (processId: string) => {
    const { data } = await axios.get<IMongoProcessInstancePopulated>(`${processes}/${processId}`);
    return data;
};

const referencedEntityToEntityId = (entityReferences: Record<string, IReferencedEntityForProcess | string | undefined>) => {
    return Object.entries(entityReferences)
        .filter(([_key, value]) => value)
        .reduce((entityIdsObject, [key, value]) => {
            entityIdsObject[key] = typeof value === 'string' ? value : value!.entity.properties._id;
            return entityIdsObject;
        }, {});
};
export const createProcessRequest = async (process: ProcessDetailsValues) => {
    const formData = new FormData();
    // Object.entries(process.detailsAttachments).forEach(([key, value]) => formData.append(key, value as Blob));

    const filesToUpload: any = [];
    Object.entries(process.detailsAttachments).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value)) {
            value.forEach((file, index) => {
                if (file instanceof File && process?.template?.details.properties.properties[key].items) {
                    filesToUpload.push([`${key}.${index}`, file]);
                } else if (file instanceof File) {
                    filesToUpload.push([`${key}`, file]);
                }
            });
        } else {
            filesToUpload.push([`${key}`, value]);
        }
    });
    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value as Blob);
    });
    const entityReferences = referencedEntityToEntityId(process.entityReferences);
    formData.append('name', process.name);
    formData.append('details', JSON.stringify({ ...process.details, ...entityReferences }));
    formData.append('templateId', process.template!._id);
    formData.append('startDate', process.startDate!.toISOString());
    formData.append('endDate', process.endDate!.toISOString());
    const transformedStepsObj = mapValues(process.steps, (reviewers) => reviewers.map(({ id }) => id));
    formData.append('steps', JSON.stringify(transformedStepsObj));

    const { data } = await axios.post<IMongoProcessInstancePopulated>(processes, formData);
    return data;
};

export const deleteProcessRequest = async (processId: string) => {
    const { data } = await axios.delete<IMongoProcessInstancePopulated>(`${processes}/${processId}`);

    return data;
};

const handleAttachmentProperties = (attachments: object, template: any) => {
    const formData = new FormData();
    const filesToUpload: any = [];
    const unchangedFiles: any = [];
    Object.entries(attachments).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value) && value) {
            value.forEach((file, index) => {
                if (file instanceof File) {
                    filesToUpload.push([`${key}.${index}`, file]);
                } else {
                    unchangedFiles.push([`${key}`, file]);
                }
            });
        } else if (value) {
            if (value instanceof File) {
                filesToUpload.push([`${key}`, value]);
            } else {
                unchangedFiles.push([`${key}`, value]);
            }
        }
    });
    filesToUpload.forEach(([key, value]) => formData.append(key, value as Blob));

    const fileProperties: { [key: string]: any } = {};
    unchangedFiles.forEach(([key, _value]) => {
        fileProperties[key] = [];
    });
    unchangedFiles.forEach(([key, value]) => {
        if (!template[key].items) {
            fileProperties[key] = value.name;
        } else if (value) {
            fileProperties[key].push(value.name);
        }
    });
    return { formData, fileProperties };
};

export const updateProcessRequest = async (processId: string, updatedData: ProcessDetailsValues, template: any) => {
    const entityReferences = referencedEntityToEntityId(updatedData.entityReferences);
    const { formData, fileProperties } = handleAttachmentProperties(updatedData.detailsAttachments, template);
    const transformedStepsObj = mapValues(updatedData.steps, (reviewers) => reviewers.map(({ id }) => id));
    formData.append(
        'details',
        JSON.stringify({
            ...updatedData.details,
            ...fileProperties,
            ...entityReferences,
        }),
    );
    formData.append('name', updatedData.name);
    formData.append('startDate', updatedData.startDate!.toISOString());
    formData.append('endDate', updatedData.endDate!.toISOString());
    formData.append('steps', JSON.stringify(transformedStepsObj));
    const { data } = await axios.put<IMongoProcessInstancePopulated>(`${processes}/${processId}`, formData);
    return data;
};
export const archiveProcessRequest = async (processId: string, archived: Boolean) => {
    const { data } = await axios.patch<IMongoProcessInstancePopulated>(`${processes}/archive/${processId}`, {
        archived,
    });
    return data;
};
export const searchProcessesRequest = async (searchBody: ISearchProcessInstancesBody) => {
    const updatedSearchBody = { ...searchBody, name: searchBody.name !== '' ? searchBody.name : undefined };
    console.log({ updatedSearchBody });

    const { data } = await axios.post<IMongoProcessInstancePopulated[]>(`${processes}/search`, updatedSearchBody);
    return data;
};

export const updateStepRequest = async (
    stepId: string,
    values: ProcessStepValues,
    processId: string,
    currStep: IMongoStepInstancePopulated,
    template: any,
) => {
    const { formData, fileProperties } = handleAttachmentProperties(values.attachmentsProperties, template);
    const entityReferences = referencedEntityToEntityId(values.entityReferences);

    formData.append(
        'properties',
        JSON.stringify({
            ...values.properties,
            ...fileProperties,
            ...entityReferences,
        }),
    );
    if (currStep.status !== values.status) formData.append('status', values.status);
    if (values.comments !== '') formData.append('comments', values.comments);

    const { data } = await axios.patch<IMongoStepInstancePopulated>(`${processes}/${processId}/steps/${stepId}`, formData);
    return data;
};
