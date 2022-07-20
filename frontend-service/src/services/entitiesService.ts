import { IServerSideGetRowsRequest } from '@ag-grid-community/core';
import partition from 'lodash.partition';
import axios from '../axios';
import { environment } from '../globals';
import { IEntity, IEntityExpanded } from '../interfaces/entities';
import { EntityWizardValues } from '../common/wizards/entity';

const { entities, relationships } = environment.api;

const getEntitiesByTemplateRequest = async (
    templateId: string,
    agGridRequest: Pick<IServerSideGetRowsRequest, 'startRow' | 'endRow' | 'sortModel' | 'filterModel'> & { quickFilter?: string },
) => {
    const { data } = await axios.post<{ rows: IEntity[]; lastRowIndex: number }>(`${entities}/search`, agGridRequest, { params: { templateId } });
    return data;
};

const getExpandedEntityByIdRequest = async (entityId: string, options?: { disabled?: boolean }) => {
    const { data } = await axios.post<IEntityExpanded>(`${entities}/expanded/${entityId}`, options);
    return data;
};

const getRelationshipInstancesCountByTemplateIdRequest = async (templateId: string) => {
    const { data } = await axios.get<number>(`${relationships}/count`, { params: { templateId } });
    return data;
};

const createEntityRequest = async (entity: EntityWizardValues) => {
    const formData = new FormData();
    Object.entries(entity.attachmentsProperties).forEach(([key, value]) => formData.append(key, value));
    formData.append('properties', JSON.stringify(entity.properties));
    formData.append('templateId', entity.template._id);
    const { data } = await axios.post<IEntity>(entities, formData);
    return data;
};

const updateEntityStatusRequest = async (entityId: string, disabled: boolean) => {
    const { data } = await axios.patch<IEntity>(`${entities}/${entityId}/status`, { disabled });
    return data;
};

const updateEntityRequest = async (entityId: string, newEntityData: EntityWizardValues) => {
    const formData = new FormData();
    const [fileToUpload, unchangedFiles] = partition(Object.entries(newEntityData.attachmentsProperties), ([_key, value]) => value instanceof File);

    fileToUpload.forEach(([key, value]) => formData.append(key, value));
    const fileProperties = {};
    unchangedFiles.forEach(([key, value]) => {
        if (value) {
            fileProperties[key] = value.name;
        }
    });

    formData.append('properties', JSON.stringify({ ...newEntityData.properties, ...fileProperties }));
    formData.append('templateId', newEntityData.template._id);
    const { data } = await axios.put<IEntity>(`${entities}/${entityId}`, formData);

    return data;
};

const deleteEntityRequest = async (entityId: string) => {
    const { data } = await axios.delete(`${entities}/${entityId}`);
    return data;
};

export {
    getEntitiesByTemplateRequest,
    createEntityRequest,
    deleteEntityRequest,
    getExpandedEntityByIdRequest,
    updateEntityRequest,
    getRelationshipInstancesCountByTemplateIdRequest,
    updateEntityStatusRequest,
};
