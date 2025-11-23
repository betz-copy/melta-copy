/* eslint-disable no-param-reassign */
import mapValues from 'lodash.mapvalues';
import axios from '../axios';
import urlToFile from '../common/fileConversions';
import { ProcessDetailsValues } from '../common/wizards/processInstance/ProcessDetails';
import { ProcessStepValues } from '../common/wizards/processInstance/ProcessSteps';
import { environment } from '../globals';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, ISearchProcessInstancesBody } from '../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../interfaces/processes/processTemplate';
import { IMongoStepInstancePopulated } from '../interfaces/processes/stepInstance';

const { processes } = environment.api;
const { uuidFormat } = environment;

const isUUID = (str: string) => uuidFormat.test(str);

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

    const filesToUpload: any = [];

    const filePropertiesToUpload = await Promise.all(
        Object.entries(process.details)
            .filter(([_key, value]) => value !== undefined && value.format === 'signature')
            .map(async ([key, value]) => {
                const templatePropertyTitle = process.template!.details.properties.properties[key].title;
                const file = await urlToFile(value, templatePropertyTitle);
                return { key, file };
            }),
    );
    filePropertiesToUpload.forEach(({ key, file }) => {
        filesToUpload.push([`${key}`, file]);
    });

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
    const filteredDetails = Object.fromEntries(
        Object.entries(process.details).filter(([key]) => !filePropertiesToUpload.some(({ key: uploadedKey }) => uploadedKey === key)),
    );
    formData.append('name', process.name);
    formData.append('details', JSON.stringify({ ...filteredDetails, ...entityReferences }));
    formData.append('templateId', process.template!._id);
    formData.append('startDate', process.startDate!.toISOString());
    formData.append('endDate', process.endDate!.toISOString());
    const transformedStepsObj = mapValues(process.steps, (reviewers) => reviewers.map(({ _id }) => _id));
    formData.append('steps', JSON.stringify(transformedStepsObj));

    const { data } = await axios.post<IMongoProcessInstancePopulated>(processes, formData);
    return data;
};

export const deleteProcessRequest = async (processId: string) => {
    const { data } = await axios.delete<IMongoProcessInstancePopulated>(`${processes}/${processId}`);

    return data;
};

const handleAttachmentProperties = async (attachments: object, properties: object, template: any) => {
    const formData = new FormData();
    const filesToUpload: any = [];
    const unchangedFiles: any = [];
    const signatureFilesUploadPromises: Promise<[string, File]>[] = [];
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

    for (const [key, value] of Object.entries(properties)) {
        if (template[key]?.format === 'signature') {
            if (value && isUUID(value)) {
                unchangedFiles.push([key, { name: value }]);
            } else if (value) {
                signatureFilesUploadPromises.push(urlToFile(value, template[key]!.title).then((file) => [key, file]));
            }
        }
    }
    filesToUpload.push(...(await Promise.all(signatureFilesUploadPromises)));

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

export const updateProcessRequest = async (processId: string, updatedData: ProcessDetailsValues, template: IMongoProcessTemplatePopulated) => {
    const entityReferences = referencedEntityToEntityId(updatedData.entityReferences);

    const { formData, fileProperties } = await handleAttachmentProperties(
        updatedData.detailsAttachments,
        updatedData.details,
        template.details.properties.properties,
    );
    const transformedStepsObj = mapValues(updatedData.steps, (reviewers) => reviewers.map(({ _id }) => _id));

    const filteredDetails = mapValues(updatedData.details, (detail, key) => {
        const format = template.details.properties.properties[key]?.format;
        if (format === 'signature' && !isUUID(detail)) return undefined;
        if (format === 'date' && detail) return new Date(detail).toISOString().split('T')[0];
        if (format === 'date-time' && detail) return new Date(detail).toISOString();
        return detail;
    });
    formData.append(
        'details',
        JSON.stringify({
            ...filteredDetails,
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
export const archiveProcessRequest = async (processId: string, archived: boolean) => {
    const { data } = await axios.patch<IMongoProcessInstancePopulated>(`${processes}/archive/${processId}`, {
        archived,
    });
    return data;
};
export const searchProcessesRequest = async (searchBody: ISearchProcessInstancesBody) => {
    const updatedSearchBody = { ...searchBody, searchText: searchBody.searchText || undefined };

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
    const { formData, fileProperties } = await handleAttachmentProperties(values.attachmentsProperties, values.properties, template);
    const entityReferences = referencedEntityToEntityId(values.entityReferences);
    const filteredProperties = mapValues(values.properties, (property, key) => {
        const format = template[key]?.format;
        if (format === 'signature' && !isUUID(property)) return undefined;
        if (format === 'date' && property) return new Date(property).toISOString().split('T')[0];
        if (format === 'date-time' && property) return new Date(property).toISOString();
        return property;
    });
    formData.append(
        'properties',
        JSON.stringify({
            ...filteredProperties,
            ...fileProperties,
            ...entityReferences,
        }),
    );
    if (currStep.status !== values.status) formData.append('status', values.status);
    if (values.comments !== '') formData.append('comments', values.comments);

    const { data } = await axios.patch<IMongoStepInstancePopulated>(`${processes}/${processId}/steps/${stepId}`, formData);
    return data;
};
