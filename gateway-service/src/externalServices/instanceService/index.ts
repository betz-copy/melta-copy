import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import { IBrokenRule } from '../ruleBreachService/interfaces';
import { IConstraintsOfTemplate, IEntity, ISearchEntitiesOfTemplateBody, ISearchResult } from './interfaces/entities';
import { IRelationship } from './interfaces/relationships';
import { IConnection } from './interfaces/rules';

const {
    instanceService: { url, baseEntitiesRoute, baseRelationshipsRoute, baseConstraintsRoute, requestTimeout, searchOfTemplateRoute },
} = config;

export class InstancesService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    // entity instances
    async getEntityInstanceById(id: string) {
        const { data } = await this.api.get<IEntity>(`${baseEntitiesRoute}/${id}`);
        return data;
    }

    async createEntityInstance(entity: IEntity) {
        const { data } = await this.api.post<IEntity>(`${baseEntitiesRoute}`, entity);

        return data;
    }

    async updateEntityInstance(id: string, entity: IEntity, ignoredRules: IBrokenRule[]) {
        const { data } = await this.api.put<IEntity>(`${baseEntitiesRoute}/${id}`, { ...entity, ignoredRules });

        return data;
    }

    async updateEntityStatus(id: string, disabled: boolean, ignoredRules: IBrokenRule[]) {
        const { data } = await this.api.patch<IEntity>(`${baseEntitiesRoute}/${id}/status`, { disabled, ignoredRules });

        return data;
    }

    async deleteEntityInstance(id: string) {
        const { data } = await this.api.delete<string>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    async searchEntitiesOfTemplateRequest(templateId: string, searchBody: ISearchEntitiesOfTemplateBody) {
        const { data } = await this.api.post<ISearchResult>(`${baseEntitiesRoute}${searchOfTemplateRoute}/${templateId}`, searchBody);

        return data;
    }

    // relationships instances
    async getRelationshipInstanceById(id: string) {
        const { data } = await this.api.get<IRelationship>(`${baseRelationshipsRoute}/${id}`);

        return data;
    }

    async createRelationshipInstance(relationship: IRelationship, ignoredRules: IBrokenRule[]) {
        const { data } = await this.api.post<IRelationship>(baseRelationshipsRoute, {
            relationshipInstance: relationship,
            ignoredRules,
        });

        return data;
    }

    async deleteRelationshipInstance(id: string, ignoredRules: IBrokenRule[]) {
        const { data } = await this.api.delete<IRelationship>(`${baseRelationshipsRoute}/${id}`, { data: { ignoredRules } });

        return data;
    }

    async getRelationshipsCountByTemplateId(templateId: string) {
        const { data } = await this.api.get<number>(`${baseRelationshipsRoute}/count`, { params: { templateId } });

        return data;
    }

    async getRelationshipsConnectionsByIds(relationshipIds: string[]) {
        const { data } = await this.api.post<IConnection[]>(`${baseRelationshipsRoute}/connections`, {
            ids: relationshipIds,
        });

        return data;
    }

    // constraints
    async getAllConstraints() {
        const { data } = await this.api.get<IConstraintsOfTemplate[]>(baseConstraintsRoute);

        return data;
    }

    async getConstraintsOfTemplate(templateId: string) {
        const { data } = await this.api.get<IConstraintsOfTemplate>(`${baseConstraintsRoute}/${templateId}`);

        return data;
    }

    async updateConstraintsOfTemplate(templateId: string, constraints: { requiredConstraints: string[]; uniqueConstraints: string[][] }) {
        const { data } = await this.api.put<IConstraintsOfTemplate[]>(`${baseConstraintsRoute}/${templateId}`, constraints);

        return data;
    }
}
