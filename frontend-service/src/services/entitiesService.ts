import { IServerSideGetRowsRequest } from '@ag-grid-community/core';
import partition from 'lodash.partition';
import axios from '../axios';
import { environment } from '../globals';
import { IEntity, IEntityExpanded, ISearchBatchBody, ISearchBatchResult } from '../interfaces/entities';
import { EntityWizardValues } from '../common/wizards/entity';
import { IRuleBreach } from '../interfaces/ruleBreaches/ruleBreach';

const { entities, relationships } = environment.api;

export const getEntitiesByTemplateRequest = async (
    templateIds: string[],
    agGridRequest: Pick<IServerSideGetRowsRequest, 'startRow' | 'endRow' | 'sortModel' | 'filterModel'> & { quickFilter?: string },
) => {
    if (templateIds.length === 0) {
        // backend assumes at least 1 templateId, if not, obvious answer
        return { rows: [], lastRowIndex: 0 };
    }

    const { data } = await axios.post<{ rows: IEntity[]; lastRowIndex: number }>(`${entities}/search`, agGridRequest, { params: { templateIds } });
    return data;
};

export const exportTemplatesToExcelRequest = async (templateIds: string[], fileName: string) => {
    const { data } = await axios.post(`${entities}/export`, { templateIds, fileName }, { responseType: 'blob', timeout: 60000 });
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
            fileProperties[key] = value.name;
        }
    });

    formData.append('properties', JSON.stringify({ ...newEntityData.properties, ...fileProperties }));
    formData.append('templateId', newEntityData.template._id);

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }

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

export const getEntitiesWithDirectConnections = async (searchBody: ISearchBatchBody) => {
    const { data } = await axios.post<ISearchBatchResult>(`${entities}/search/batch`, searchBody);
    return data;
};
