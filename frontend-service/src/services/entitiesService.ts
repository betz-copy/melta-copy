import partition from 'lodash.partition';
import axios from '../axios';
import { environment } from '../globals';
import {
    IEntity,
    IEntityExpanded,
    ISearchBatchBody,
    ISearchResult,
    ISearchEntitiesOfTemplateBody,
    IExportEntitiesBody,
} from '../interfaces/entities';
import { EntityWizardValues } from '../common/dialogs/entity';
import { IRuleBreach } from '../interfaces/ruleBreaches/ruleBreach';
import { D } from '../utils/icons/fa6Icons';

const { entities, relationships } = environment.api;

export const exportEntitiesRequest = async (body: IExportEntitiesBody) => {
    const { data } = await axios.post(`${entities}/export`, body, { responseType: 'blob', timeout: 60000 });
    return data;
};

export const getExpandedEntityByIdRequest = async (
    entityId: string,
    options?: { disabled?: boolean; templateIds: string[]; numberOfConnections?: number },
) => {
    const { data } = await axios.post<IEntityExpanded>(`${entities}/expanded/${entityId}`, options);
    return data;
};

export const getRelationshipInstancesCountByTemplateIdRequest = async (templateId: string) => {
    const { data } = await axios.get<number>(`${relationships}/count`, { params: { templateId } });
    return data;
};

export const createEntityRequest = async (entity: EntityWizardValues) => {
    const formData = new FormData();
    Object.entries(entity.attachmentsProperties).forEach(([key, value]) => formData.append(key, value!));
    formData.append('properties', JSON.stringify(entity.properties));
    formData.append('templateId', entity.template._id);
    const { data } = await axios.post<IEntity>(entities, formData);
    return data;
};

export const updateEntityStatusRequest = async (entityId: string, disabled: boolean, ignoredRules?: string) => {
    const { data } = await axios.patch<IEntity>(`${entities}/${entityId}/status`, { disabled, ignoredRules });
    return data;
};

export const updateEntityRequest = async (entityId: string, newEntityData: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
    const formData = new FormData();
    const [fileToUpload, unchangedFiles] = partition(Object.entries(newEntityData.attachmentsProperties), ([_key, value]) => value instanceof File);

    fileToUpload.forEach(([key, value]) => formData.append(key, value as Blob));
    const fileProperties = {};
    unchangedFiles.forEach(([key, value]) => {
        if (value) {
            console.log(key, value);
            fileProperties[key] = value.name;
        }
    });
    console.log(fileToUpload, unchangedFiles);
    formData.append('properties', JSON.stringify({ ...newEntityData.properties, ...fileProperties }));
    formData.append('templateId', newEntityData.template._id);

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }
    const { data } = await axios.put<IEntity>(`${entities}/${entityId}`, formData);

    return data;
};

export const updateEntityRequestForMultiple = async (entityId: string, newEntityData: any, ignoredRules?: IRuleBreach['brokenRules']) => {
    console.log(newEntityData, newEntityData.attachmentsProperties.files, Object.entries(newEntityData.attachmentsProperties));
    const formData = new FormData();

    const filesToUpload: any = [];
    const unchangedFiles: any = [];

    Object.entries(newEntityData.attachmentsProperties).forEach(([key, value]: [string, any]) => {
        console.log(key, value);
        value.forEach((file, index) => {
            if (file instanceof File) {
                filesToUpload.push([`${key}.${index}`, file]);
            } else {
                unchangedFiles.push([`${key}.${index}`, file]);
            }
        });
    });
    filesToUpload.forEach(([key, value]) => {
        console.log(key, value);
        formData.append(key, value as Blob);
    });

    console.log('11111111111111', filesToUpload, unchangedFiles);

    const fileProperties = {};
    unchangedFiles.forEach(([key, value]) => {
        if (value) {
            fileProperties[key] = value.name;
        }
    });

    formData.append('properties', JSON.stringify({ ...newEntityData.properties, ...fileProperties }));
    formData.append('templateId', newEntityData.template._id);

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }
    console.log(formData);
    const { data } = await axios.put<IEntity>(`${entities}/${entityId}`, formData);

    return data;
};
export const duplicateEntityRequest = async (entityId: string, newEntityData: EntityWizardValues) => {
    const formData = new FormData();
    const [fileToUpload, unchangedFiles] = partition(Object.entries(newEntityData.attachmentsProperties), ([_key, value]) => value instanceof File);

    fileToUpload.forEach(([key, value]) => formData.append(key, value as Blob));
    const fileProperties = {};
    unchangedFiles.forEach(([key, value]) => {
        if (value) {
            fileProperties[key] = value.name;
        }
    });

    formData.append('properties', JSON.stringify({ ...newEntityData.properties, ...fileProperties }));
    formData.append('templateId', newEntityData.template._id);
    const { data } = await axios.post<IEntity>(`${entities}/${entityId}/duplicate`, formData);

    return data;
};

export const deleteEntityRequest = async (entityId: string) => {
    const { data } = await axios.delete(`${entities}/${entityId}`);
    return data;
};

export const searchEntitiesOfTemplateRequest = async (templateId: string, searchBody: ISearchEntitiesOfTemplateBody) => {
    const { data } = await axios.post<ISearchResult>(`${entities}/search/template/${templateId}`, searchBody);
    return data;
};

export const getEntitiesWithDirectConnections = async (searchBody: ISearchBatchBody) => {
    const { data } = await axios.post<ISearchResult>(`${entities}/search/batch`, searchBody);
    return data;
};
