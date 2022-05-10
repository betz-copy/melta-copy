import { IServerSideGetRowsRequest } from '@ag-grid-community/core';
import axios from '../axios';
import { environment } from '../globals';
import { IEntity, IEntityExpanded } from '../interfaces/entities';

const { entities } = environment.api;

const getAllEntitiesRequest = async () => {
    const { data } = await axios.get<{ nodes: IEntity[]; links: any[] }>(`${entities}/all`);
    return data;
};

const getEntitiesByTemplateRequest = async (
    templateId: string,
    agGridRequest: Pick<IServerSideGetRowsRequest, 'startRow' | 'endRow' | 'sortModel' | 'filterModel'> & { quickFilterText?: string },
) => {
    const { data } = await axios.post<{ rows: IEntity[]; lastRowIndex: number }>(`${entities}/search`, agGridRequest, { params: { templateId } });
    return data;
};

const getRelatedEntitiesByIdRequest = async (entityId: string) => {
    const { data } = await axios.get<{ nodes: IEntity[]; links: any[] }>(`${entities}/${entityId}`);
    return data;
};

const getExpandedEntityByIdRequest = async (entityId: string) => {
    const { data } = await axios.get<IEntityExpanded>(`${entities}/${entityId}?expanded=true`);
    return data;
};

const createEntityRequest = async (entity: IEntity) => {
    const { data } = await axios.post<IEntity>(entities, entity);
    return data;
};

const updateEntityRequest = async (entityId: string, newEntityData: IEntity) => {
    const { data } = await axios.put(`${entities}/${entityId}`, newEntityData);
    return data;
};

const deleteEntityRequest = async (entityId: string) => {
    const { data } = await axios.delete(`${entities}/${entityId}`);
    return data;
};

export {
    getAllEntitiesRequest,
    getEntitiesByTemplateRequest,
    getRelatedEntitiesByIdRequest,
    createEntityRequest,
    deleteEntityRequest,
    getExpandedEntityByIdRequest,
    updateEntityRequest,
};
