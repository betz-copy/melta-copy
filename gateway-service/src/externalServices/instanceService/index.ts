import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import { IAction, IBrokenRule } from '../ruleBreachService/interfaces';
import { IEntitySingleProperty } from '../templates/entityTemplateService';
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

export class InstancesService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    // entity instances
    async updateEnumFieldOfEntity(id: string, newValue: string, oldValue: string, field: any) {
        const { data } = await this.api.put<IEntity>(`${baseEntitiesRoute}/update-enum-field/${id}`, { newValue, oldValue, field });
        return data;
    }

    async getIfValuefieldIsUsed(id: string, fieldValue: string, fieldName: string, type: string) {
        const { data } = await this.api.get<IEntity>(`${baseEntitiesRoute}/get-is-field-used/${id}`, {
            params: {
                fieldValue,
                fieldName,
                type,
            },
        });
        return data;
    }

    async getEntityInstanceById(id: string) {
        const { data } = await this.api.get<IEntity>(`${baseEntitiesRoute}/${id}`);
        return data;
    }

    async getEntityInstancesByIds(ids: string[]) {
        const { data } = await this.api.post<IEntity[]>(`${baseEntitiesRoute}/ids`, { ids });
        return data;
    }

    async createEntityInstance(entity: IEntity, ignoredRules: IBrokenRule[], userId: string, duplicatedFromId?: string) {
        const { data } = await this.api.post<{ createdEntity: IEntity; actions?: IAction[] }>(`${baseEntitiesRoute}`, {
            ...entity,
            ignoredRules,
            userId,
            duplicatedFromId,
        });

        return data;
    }

    async updateEntityInstance(id: string, entity: IEntity, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.api.put<{ updatedEntity: IEntity; actions?: IAction[] }>(`${baseEntitiesRoute}/${id}`, {
            ...entity,
            ignoredRules,
            userId,
        });

        return data;
    }

    async updateEntityStatus(id: string, disabled: boolean, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.api.patch<IEntity>(`${baseEntitiesRoute}/${id}/status`, { disabled, ignoredRules, userId });

        return data;
    }

    async deleteEntityInstances(ids: string[], deleteAllRelationships?: boolean, selectAll?: boolean) {
        const { data } = await this.api.post(`${baseEntitiesRoute}/delete/bulk`, { ids, deleteAllRelationships, selectAll });

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

    async createRelationshipInstance(relationship: IRelationship, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.api.post<IRelationship>(baseRelationshipsRoute, {
            relationshipInstance: relationship,
            ignoredRules,
            userId,
        });

        return data;
    }

    async deleteRelationshipInstance(id: string, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.api.delete<IRelationship>(`${baseRelationshipsRoute}/${id}`, { data: { ignoredRules, userId } });

        return data;
    }

    async getRelationshipsCountByTemplateId(templateId: string) {
        const { data } = await this.api.get<number>(`${baseRelationshipsRoute}/count`, { params: { templateId } });

        return data;
    }

    async getRelationshipsByIds(relationshipIds: string[]) {
        const { data } = await this.api.post<IRelationship[]>(`${baseRelationshipsRoute}/ids`, {
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

    async updateConstraintsOfTemplate(
        templateId: string,
        constraints: { requiredConstraints: string[]; uniqueConstraints: IUniqueConstraintOfTemplate[] },
    ) {
        const { data } = await this.api.put<IConstraintsOfTemplate[]>(`${baseConstraintsRoute}/${templateId}`, constraints);

        return data;
    }

    async enumerateNewSerialNumberFields(templateId: string, newSerialNumberFields: object) {
        const { data } = await this.api.post<number>(`${baseConstraintsRoute}/enumerate-new-serial-number-fields/${templateId}`, {
            newSerialNumberFields,
        });
        return data;
    }

    async deletePropertiesOfTemplate(templateId: string, properties: string[], currentTemplateProperties: Record<string, IEntitySingleProperty>) {
        const { data } = await this.api.patch<IEntity[]>(`${baseEntitiesRoute}/deletePropertiesOfTemplate/${templateId}`, {
            properties,
            currentTemplateProperties,
        });

        return data;
    }

    async runBulkOfActions(
        actionsGroups: IAction[][],
        dryRun: boolean,
        userId: string,
        ignoredRules: IBrokenRule[] = [],
    ): Promise<PromiseSettledResult<(IEntity | IRelationship)[]>[]> {
        const { data } = await this.api.post<PromiseSettledResult<(IEntity | IRelationship)[]>[]>(
            `${baseBulkActionsRoute}/bulk`,
            { actionsGroups, ignoredRules, userId },
            { params: { dryRun } },
        );

        return data;
    }
}
