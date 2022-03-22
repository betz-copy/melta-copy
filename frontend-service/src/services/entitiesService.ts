import axios from '../axios';
import { environment } from '../globals';
import { IEntity, IRelationshipEntity } from '../interfaces/entities';

const { entities } = environment.api;

const getAllEntitiesRequest = async () => {
    const { data } = await axios.get<{ nodes: IEntity[]; links: any[] }>(`${entities}/all`);
    return data;
};

const getEntitiesByCategoryRequest = async (categoryId: string) => {
    const { data } = await axios.get<IEntity[]>(`${entities}?category=${categoryId}`);
    return data;
};

const getRelatedEntitiesByIdRequest = async (entityId: string) => {
    const { data } = await axios.get<{ nodes: IEntity[]; links: any[] }>(`${entities}/${entityId}`);
    return data;
};

const getExpandedEntityByIdRequest = async (entityId: string) => {
    const { data } = await axios.get<{ entity: IEntity; connections: { relationship: IRelationshipEntity; entity: IEntity }[] }>(
        `${entities}/${entityId}?expanded=true`,
    );
    return data;
};

const createEntityRequest = async (entity: IEntity) => {
    const { data } = await axios.post<IEntity>(entities, entity);
    return data;
};

const deleteEntityRequest = async (entityId: string) => {
    const { data } = await axios.delete(`${entities}/${entityId}`);
    return data;
};

export {
    getAllEntitiesRequest,
    getEntitiesByCategoryRequest,
    getRelatedEntitiesByIdRequest,
    createEntityRequest,
    deleteEntityRequest,
    getExpandedEntityByIdRequest,
};
