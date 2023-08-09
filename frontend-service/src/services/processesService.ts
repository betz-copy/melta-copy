import partition from 'lodash.partition';
import mapValues from 'lodash.mapvalues';
import { IMongoStepInstancePopulated } from '../interfaces/processes/stepInstance';
import axios from '../axios';
import { ProcessDetailsValues } from '../common/wizards/processInstance/ProcessDetails';
import { environment } from '../globals';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, ISearchProcessInstancesBody } from '../interfaces/processes/processInstance';
import { SummaryDetailsValues } from '../common/wizards/processInstance/ProcessSummaryStep';
import { isProcessDetailsValues } from '../utils/processWizard/checkFormikValuesType';
import { ProcessStepValues } from '../common/wizards/processInstance/ProcessSteps';

const { processes } = environment.api;
const getProcessByIdRequest = async (processId: string) => {
    const { data } = await axios.get<IMongoProcessInstancePopulated>(`${processes}/${processId}`);
    return data;
};

const createProcessRequest = async (process: ProcessDetailsValues) => {
    const formData = new FormData();
    Object.entries(process.detailsAttachments).forEach(([key, value]) => formData.append(`details.${key}`, value as Blob));
    const entityReferences = Object.entries(process.entityReferences)
        .filter(([_key, value]: [string, IReferencedEntityForProcess | undefined]) => value?.entity && value.entity.properties)
        .reduce((entityIdsObject: { [key: string]: string }, [key, value]: [string, IReferencedEntityForProcess]) => {
            entityIdsObject[key] = value.entity.properties._id;
            return entityIdsObject;
        }, {});
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

const deleteProcessRequest = async (processId: string) => {
    const { data } = await axios.delete<IMongoProcessInstancePopulated>(`${processes}/${processId}`);
    return data;
};

const processAttachments = (attachments: object, prefix: string, formData: FormData) => {
    const [filesToUpload, unchangedFiles] = partition(Object.entries(attachments), ([_key, value]) => value instanceof File);

    filesToUpload.forEach(([key, value]) => formData.append(`${prefix}.${key}`, value as Blob));

    const fileProperties = {};
    unchangedFiles.forEach(([key, value]) => {
        if (value) {
            fileProperties[key] = value.name;
        }
    });

    return fileProperties;
};

const updateProcessRequest = async (processId: string, updatedData: ProcessDetailsValues | SummaryDetailsValues) => {
    const formData = new FormData();
    const entityReferences = Object.entries(updatedData.entityReferences)
        .filter(([_key, value]: [string, IReferencedEntityForProcess | undefined]) => value?.entity && value.entity.properties)
        .reduce((entityIdsObject: { [key: string]: string }, [key, value]: [string, IReferencedEntityForProcess]) => {
            entityIdsObject[key] = value.entity.properties._id;
            return entityIdsObject;
        }, {});
    if (isProcessDetailsValues(updatedData)) {
        const detailsFileProperties = processAttachments(updatedData.detailsAttachments, 'details', formData);
        const transformedStepsObj = mapValues(updatedData.steps, (reviewers) => reviewers.map(({ id }) => id));
        formData.append(
            'details',
            JSON.stringify({
                ...updatedData.details,
                ...detailsFileProperties,
                ...entityReferences,
            }),
        );
        formData.append('name', updatedData.name);
        formData.append('startDate', updatedData.startDate!.toISOString());
        formData.append('endDate', updatedData.endDate!.toISOString());
        formData.append('steps', JSON.stringify(transformedStepsObj));
    } else {
        const summaryFileProperties = processAttachments(updatedData.summaryAttachments, 'summaryDetails', formData);
        formData.append(
            'summaryDetails',
            JSON.stringify({
                ...updatedData.summaryDetails,
                ...summaryFileProperties,
                ...entityReferences,
            }),
        );
        formData.append('status', updatedData.status);
    }

    const { data } = await axios.put<IMongoProcessInstancePopulated>(`${processes}/${processId}`, formData);
    return data;
};

const searchProcessesRequest = async (searchBody: ISearchProcessInstancesBody) => {
    const updatedSearchBody = { ...searchBody, name: searchBody.name !== '' ? searchBody.name : undefined };

    const { data } = await axios.post<IMongoProcessInstancePopulated[]>(`${processes}/search`, updatedSearchBody);
    return data;
};

const updateStepRequest = async (stepId: string, values: ProcessStepValues, processId: string, currStep: IMongoStepInstancePopulated) => {
    const formData = new FormData();

    const [filesToUpload, unchangedFiles] = partition(Object.entries(values.attachmentsProperties), ([_key, value]) => value instanceof File);

    filesToUpload.forEach(([key, value]) => formData.append(key, value as Blob));

    const fileProperties = {};
    unchangedFiles.forEach(([key, value]) => {
        if (value) {
            fileProperties[key] = value.name;
        }
    });

    const entityReferences = Object.entries(values.entityReferences)
        .filter(([_key, value]: [string, IReferencedEntityForProcess | undefined]) => value?.entity && value.entity.properties)
        .reduce((entityIdsObject: { [key: string]: string }, [key, value]: [string, IReferencedEntityForProcess]) => {
            entityIdsObject[key] = value.entity.properties._id;
            return entityIdsObject;
        }, {});

    formData.append(
        'properties',
        JSON.stringify({
            ...values.properties,
            ...fileProperties,
            ...entityReferences,
        }),
    );
    if (currStep.status !== values.status) formData.append('status', values.status);
    const { data } = await axios.patch<IMongoStepInstancePopulated>(`${processes}/${processId}/steps/${stepId}`, formData);
    return data;
};

export { getProcessByIdRequest, createProcessRequest, deleteProcessRequest, updateProcessRequest, searchProcessesRequest, updateStepRequest };
