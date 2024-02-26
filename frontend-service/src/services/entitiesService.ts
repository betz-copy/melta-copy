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
import { EntityWizardValuesNew } from '../common/dialogs/entity';
import { IRuleBreach } from '../interfaces/ruleBreaches/ruleBreach';

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

export const createEntityRequest = async (entity: EntityWizardValuesNew) => {
    const formData = new FormData();

    const filesToUpload: any = [];
    Object.entries(entity.attachmentsProperties).forEach(([key, value]: [string, any]) => {
        value.forEach((file, index) => {
            if (file instanceof File && entity.template.properties.properties[key].items) {
                filesToUpload.push([`${key}.${index}`, file]);
            } else if (file instanceof File) {
                filesToUpload.push([`${key}`, file]);
            }
        });
    });
    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value as Blob);
    });
    // Object.entries(entity.attachmentsProperties).forEach(([key, value]) => formData.append(key, value));
    formData.append('properties', JSON.stringify(entity.properties));
    formData.append('templateId', entity.template._id);
    const { data } = await axios.post<IEntity>(entities, formData);
    return data;
};

export const updateEntityStatusRequest = async (entityId: string, disabled: boolean, ignoredRules?: string) => {
    const { data } = await axios.patch<IEntity>(`${entities}/${entityId}/status`, { disabled, ignoredRules });
    return data;
};

export const updateEntityRequestForMultiple = async (
    entityId: string,
    newEntityData: EntityWizardValuesNew,
    ignoredRules?: IRuleBreach['brokenRules'],
) => {
    const formData = new FormData();

    const filesToUpload: any = [];
    const unchangedFiles: any = []; /////send single file as array to the back
    Object.entries(newEntityData.attachmentsProperties).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value) && value) {
            value.forEach((file, index) => {
                if (file instanceof File && newEntityData.template.properties.properties[key].items) {
                    filesToUpload.push([`${key}.${index}`, file]);
                } else if (file instanceof File) {
                    filesToUpload.push([`${key}`, file]);
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
    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value as Blob);
    });
    unchangedFiles.forEach(([key, _value]) => {
        newEntityData.properties[key] = [];
    });
    unchangedFiles.forEach(([key, value]) => {
        if (!newEntityData.template.properties.properties[key].items) {
            newEntityData.properties[key] = value.name;
        } else {
            if (!newEntityData.properties[key]) {
                newEntityData.properties[key] = [];
            }
            if (value) {
                newEntityData.properties[key].push(value.name);
            }
        }
    });
    formData.append('properties', JSON.stringify({ ...newEntityData.properties }));
    formData.append('templateId', newEntityData.template._id);

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }
    const { data } = await axios.put<IEntity>(`${entities}/${entityId}`, formData);
    return data;
};

export const duplicateEntityRequest = async (entityId: string, newEntityData: EntityWizardValuesNew) => {
    const formData = new FormData();
    const filesToUpload: any = [];
    const unchangedFiles: any = [];

    Object.entries(newEntityData.attachmentsProperties).forEach(([key, value]: [string, any]) => {
        value.forEach((file, index) => {
            if (file instanceof File && newEntityData.template.properties.properties[key].items) {
                filesToUpload.push([`${key}.${index}`, file]);
            } else if (file instanceof File) {
                filesToUpload.push([`${key}`, file]);
            } else {
                unchangedFiles.push([`${key}`, file]);
            }
        });
    });

    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value as Blob);
    });
    unchangedFiles.forEach(([key, value]) => {
        if (!newEntityData.template.properties.properties[key].items) {
            newEntityData.properties[key] = value.name;
        } else {
            if (!newEntityData.properties[key]) {
                newEntityData.properties[key] = [];
            }
            if (value) {
                newEntityData.properties[key].push(value.name);
            }
        }
    });

    formData.append('properties', JSON.stringify({ ...newEntityData.properties }));
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
