import axios from 'axios';
import config from '../config';
import { IAgGridResult } from '../utils/agGrid/interface';
import { IBrokenRule } from './ruleBreachService/interfaces';

const {
    instanceManager: { uri, baseEntitiesRoute, baseRelationshipsRoute, baseConstraintsRoute, requestTimeout, searchRoute },
} = config;

export interface IEntity {
    templateId: string;
    properties: {
        _id: string;
        createdAt: string;
        updatedAt: string;
        disabled: boolean;
    } & Record<string, any>;
}

export interface IEntityFilterParams {
    startRow?: number;
    endRow?: number;
    sortModel?: Array<{
        colId: string;
        sort: 'asc' | 'desc';
    }>;
    filterModel?: any;
    quickFilter?: string;
}
export interface IRelationship {
    templateId: string;
    properties: { _id: string } & Record<string, any>;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface IRelationshipPopulated extends Omit<IRelationship, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity;
    destinationEntity: IEntity;
}

export interface IRelationshipConnections {
    relationship: IRelationship;
    sourceEntity: IEntity;
    destinationEntity: IEntity;
}

export interface IUniqueConstraint {
    type: 'UNIQUE';
    constraintName: string;
    templateId: string;
    properties: string[];
}

export interface IRequiredConstraint {
    type: 'REQUIRED';
    constraintName: string;
    templateId: string;
    property: string;
}

export type IConstraint = IRequiredConstraint | IUniqueConstraint;

export interface IConstraintsOfTemplate {
    templateId: string;
    requiredConstraints: string[];
    uniqueConstraints: string[][];
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

    static async updateEntityInstance(id: string, entity: IEntity, ignoredRules: IBrokenRule[]) {
        const { data } = await this.InstanceManagerApi.put<IEntity>(`${baseEntitiesRoute}/${id}`, { ...entity, ignoredRules });

        return data;
    }

    static async updateEntityStatus(id: string, disabled: boolean, ignoredRules: IBrokenRule[]) {
        const { data } = await this.InstanceManagerApi.patch<IEntity>(`${baseEntitiesRoute}/${id}/status`, { disabled, ignoredRules });

        return data;
    }

    static async deleteEntityInstance(id: string) {
        const { data } = await this.InstanceManagerApi.delete<string>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    static async getInstancesByTemplateIds(templateIds: string[], agGridRequest: IEntityFilterParams) {
        const { data } = await this.InstanceManagerApi.post<IAgGridResult<IEntity>>(`${baseEntitiesRoute}/${searchRoute}`, agGridRequest, {
            params: { templateIds },
        });

        return data;
    }

    // relationships instances
    static async getRelationshipInstanceById(id: string) {
        const { data } = await this.InstanceManagerApi.get<IRelationship>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    static async createRelationshipInstance(relationship: IRelationship, ignoredRules: IBrokenRule[]) {
        const { data } = await this.InstanceManagerApi.post<IRelationship>(baseRelationshipsRoute, {
            relationshipInstance: relationship,
            ignoredRules,
        });

        return data;
    }

    static async deleteRelationshipInstance(id: string, ignoredRules: IBrokenRule[]) {
        const { data } = await this.InstanceManagerApi.delete<IRelationship>(`${baseRelationshipsRoute}/${id}`, { data: { ignoredRules } });

        return data;
    }

    static async getRelationshipsCountByTemplateId(templateId: string) {
        const { data } = await this.InstanceManagerApi.get<number>(`${baseRelationshipsRoute}/count`, { params: { templateId } });

        return data;
    }

    static async getRelationshipsConnectionsByIds(relationshipIds: string[]) {
        const { data } = await this.InstanceManagerApi.post<IRelationshipConnections[]>(`${baseRelationshipsRoute}/connections`, {
            ids: relationshipIds,
        });

        return data;
    }

    // constraints
    static async getAllConstraints() {
        const { data } = await this.InstanceManagerApi.get<IConstraintsOfTemplate[]>(baseConstraintsRoute);

        return data;
    }

    static async getConstraintsOfTemplate(templateId: string) {
        const { data } = await this.InstanceManagerApi.get<IConstraintsOfTemplate>(`${baseConstraintsRoute}/${templateId}`);

        return data;
    }

    static async updateConstraintsOfTemplate(templateId: string, constraints: { requiredConstraints: string[]; uniqueConstraints: string[][] }) {
        const { data } = await this.InstanceManagerApi.put<IConstraintsOfTemplate[]>(`${baseConstraintsRoute}/${templateId}`, constraints);

        return data;
    }
}
