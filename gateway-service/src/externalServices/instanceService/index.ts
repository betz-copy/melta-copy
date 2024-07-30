import axios from 'axios';
import config from '../../config';
import { IAction, IBrokenRule } from '../ruleBreachService/interfaces';
import { IConstraintsOfTemplate, IEntity, ISearchEntitiesOfTemplateBody, ISearchResult, IUniqueConstraintOfTemplate } from './interfaces/entities';
import { IRelationship } from './interfaces/relationships';

const {
    instanceService: {
        url,
        baseEntitiesRoute,
        baseRelationshipsRoute,
        baseBulkActionsRoute,
        baseConstraintsRoute,
        requestTimeout,
        searchOfTemplateRoute,
    },
} = config;

export class InstanceManagerService {
    private static InstanceManagerApi = axios.create({ baseURL: url, timeout: requestTimeout });

    // entity instances
    static async updateEnumFieldOfEntity(id: string, newValue: string, oldValue: string, field: any) {
        const { data } = await this.InstanceManagerApi.put<IEntity>(`${baseEntitiesRoute}/update-enum-field/${id}`, { newValue, oldValue, field });
        return data;
    }

    static async getIfValuefieldIsUsed(id: string, fieldValue: string, fieldName: string, type: string) {
        const { data } = await this.InstanceManagerApi.get<IEntity>(`${baseEntitiesRoute}/get-is-field-used/${id}`, {
            params: {
                fieldValue,
                fieldName,
                type,
            },
        });
        return data;
    }

    static async getEntityInstanceById(id: string) {
        const { data } = await this.InstanceManagerApi.get<IEntity>(`${baseEntitiesRoute}/${id}`);
        return data;
    }

    static async getEntityInstancesByIds(ids: string[]) {
        const { data } = await this.InstanceManagerApi.post<IEntity[]>(`${baseEntitiesRoute}/ids`, { ids });
        return data;
    }

    static async createEntityInstance(entity: IEntity, ignoredRules: IBrokenRule[], userId: string, duplicatedFromId?: string) {
        const { data } = await this.InstanceManagerApi.post<{ createdEntity: IEntity; updatedEntities: IEntity[] }>(`${baseEntitiesRoute}`, {
            ...entity,
            ignoredRules,
            userId,
            duplicatedFromId,
        });

        return data;
    }

    static async updateEntityInstance(id: string, entity: IEntity, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.InstanceManagerApi.put<{ updatedEntity: IEntity; updatedEntities: IEntity[] }>(`${baseEntitiesRoute}/${id}`, {
            ...entity,
            ignoredRules,
            userId,
        });

        return data;
    }

    static async updateEntityStatus(id: string, disabled: boolean, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.InstanceManagerApi.patch<IEntity>(`${baseEntitiesRoute}/${id}/status`, { disabled, ignoredRules, userId });

        return data;
    }

    static async deleteEntityInstance(id: string, userId: string) {
        const { data } = await this.InstanceManagerApi.delete<{ deletedEntityId: string; updatedEntities: IEntity[] }>(`${baseEntitiesRoute}/${id}`, {
            data: { userId },
        });

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

    static async createRelationshipInstance(relationship: IRelationship, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.InstanceManagerApi.post<IRelationship>(baseRelationshipsRoute, {
            relationshipInstance: relationship,
            ignoredRules,
            userId,
        });

        return data;
    }

    static async deleteRelationshipInstance(id: string, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.InstanceManagerApi.delete<IRelationship>(`${baseRelationshipsRoute}/${id}`, { data: { ignoredRules, userId } });

        return data;
    }

    static async getRelationshipsCountByTemplateId(templateId: string) {
        const { data } = await this.InstanceManagerApi.get<number>(`${baseRelationshipsRoute}/count`, { params: { templateId } });

        return data;
    }

    static async getRelationshipsByIds(relationshipIds: string[]) {
        const { data } = await this.InstanceManagerApi.post<IRelationship[]>(`${baseRelationshipsRoute}/ids`, {
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

    static async updateConstraintsOfTemplate(
        templateId: string,
        constraints: { requiredConstraints: string[]; uniqueConstraints: IUniqueConstraintOfTemplate[] },
    ) {
        const { data } = await this.InstanceManagerApi.put<IConstraintsOfTemplate[]>(`${baseConstraintsRoute}/${templateId}`, constraints);

        return data;
    }

    static async enumerateNewSerialNumberFields(templateId: string, newSerialNumberFields: object) {
        const { data } = await this.InstanceManagerApi.post<number>(`${baseConstraintsRoute}/enumerate-new-serial-number-fields/${templateId}`, {
            newSerialNumberFields,
        });
        return data;
    }

    static async runBulkOfActions(
        actionsGroups: IAction[][],
        dryRun: boolean,
        ignoredRules: IBrokenRule[] = [],
        userId: string,
    ): Promise<PromiseSettledResult<(IEntity | IRelationship)[]>[]> {
        console.log({
            actionsGroups,
            dryRun,
            ignoredRules,
            userId,
        });

        const { data } = await this.InstanceManagerApi.post<PromiseSettledResult<(IEntity | IRelationship)[]>[]>(
            `${baseBulkActionsRoute}/bulk?dryRun=${dryRun}`,
            { actionsGroups, ignoredRules, userId },
        );

        return data;
    }
}
