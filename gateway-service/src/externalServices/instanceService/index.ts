import axios from 'axios';
import config from '../../config';
import { IBrokenRule } from '../ruleBreachService/interfaces';
import { IConstraintsOfTemplate, IEntity, ISearchEntitiesOfTemplateBody, ISearchResult } from './interfaces/entities';
import { IRelationship } from './interfaces/relationships';
import { IConnection } from './interfaces/rules';

const {
    instanceService: { url, baseEntitiesRoute, baseRelationshipsRoute, baseConstraintsRoute, requestTimeout, searchOfTemplateRoute },
} = config;

export class InstanceManagerService {
    private static InstanceManagerApi = axios.create({ baseURL: url, timeout: requestTimeout });

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

    static async searchEntitiesOfTemplateRequest(templateId: string, searchBody: ISearchEntitiesOfTemplateBody) {
        const { data } = await this.InstanceManagerApi.post<ISearchResult>(`${baseEntitiesRoute}${searchOfTemplateRoute}/${templateId}`, searchBody);

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
        const { data } = await this.InstanceManagerApi.post<IConnection[]>(`${baseRelationshipsRoute}/connections`, {
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

    static async deletePropertyOfTemplate(templateId: string, properties: string[]) {
        // console.log('property:', property);

        const { data } = await this.InstanceManagerApi.patch<IEntity[]>(`${baseEntitiesRoute}/deletePropertyOfTemplate/${templateId}`, {
            properties,
        });
        console.log('res in gateway', data);

        return data;
    }
}
