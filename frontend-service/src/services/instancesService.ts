import axios from '../axios';
import { environment } from '../globals';
import { IEntityInstance } from '../interfaces/instances';

const { entities } = environment.api;

const getInstancesRequest = async () => {
    const { data } = await axios.get<{ nodes: any[]; links: any[] }>(`${entities}/all`);
    return data;
};

const getInstancesByCategoryRequest = async (categoryId: string) => {
    const { data } = await axios.get<IEntityInstance[]>(`${entities}?category=${categoryId}`);
    return data;
};

const getRelatedInstancesByIdRequest = async (instanceId: string) => {
    const { data } = await axios.get<{ nodes: any[]; links: any[] }>(`${entities}/${instanceId}`);
    return data;
};

const createEntityInstanceRequest = async (entityInstance: IEntityInstance) => {
    const { data } = await axios.post<IEntityInstance>(entities, entityInstance);
    return data;
};
export { getInstancesRequest, getInstancesByCategoryRequest, getRelatedInstancesByIdRequest, createEntityInstanceRequest };
