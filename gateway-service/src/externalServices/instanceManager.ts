import axios from 'axios';
import config from '../config';

const {
    instanceManager: { uri, baseEntitiesRoute, baseRelationshipsRoute, requestTimeout, searchRoute },
} = config;

export interface IEntity {
    templateId: string;
    properties: object;
}

interface IEntityFilterParams {
    startRow?: number;
    endRow?: number;
    sortModel?: Array<{
        colId: string;
        sort: 'asc' | 'desc';
    }>;
    filterModel?: any;
}
export interface IRelationship {
    templateId: string;
    properties: object;
    sourceEntityId: string;
    destinationEntityId: string;
}

export class InstanceManagerService {
    private static InstanceManagerApi = axios.create({ baseURL: uri, timeout: requestTimeout });

    // entity instances
    static async getEntityInstanceById(id: string) {
        const { data } = await this.InstanceManagerApi.get<IEntity>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    static async createEntityInstance(entity: IEntity) {
        const { data } = await this.InstanceManagerApi.post<IEntity>(`${baseEntitiesRoute}`, entity);

        return data;
    }

    static async updateEntityInstance(id: string, entity: IEntity) {
        const { data } = await this.InstanceManagerApi.put<IEntity>(`${baseEntitiesRoute}/${id}`, entity);

        return data;
    }

    static async deleteEntityInstance(id: string) {
        const { data } = await this.InstanceManagerApi.delete<string>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    static async getInstancesByTemplateId(templateId: string, agGridRequest: IEntityFilterParams) {
        const { data } = await this.InstanceManagerApi.post<{ rows: IEntity[]; lastRowIndex: number }>(
            `${baseEntitiesRoute}/${searchRoute}`,
            agGridRequest,
            { params: { templateId } },
        );

        return data;
    }

    // relationships instances
    static async getRelationshipInstanceById(id: string) {
        const { data } = await this.InstanceManagerApi.get<IRelationship>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    static async getRelationshipsCountByTemplateId(templateId: string) {
        const { data } = await this.InstanceManagerApi.get<number>(`${baseRelationshipsRoute}/count`, { params: { templateId } });

        return data;
    }
}
