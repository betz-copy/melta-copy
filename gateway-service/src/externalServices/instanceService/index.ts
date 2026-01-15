import { IChartBody } from '@packages/chart';
import {
    IBulkOfActions,
    IConstraintsOfTemplate,
    ICountSearchResult,
    IDeleteEntityBody,
    IEntity,
    IEntityExpanded,
    IEntityWithDirectRelationships,
    IMultipleSelect,
    IPropertyValue,
    ISearchBatchBody,
    ISearchEntitiesByLocationBody,
    ISearchEntitiesOfTemplateBody,
    ISearchFilter,
    ISearchResult,
    ITemplateSearchBody,
    IUniqueConstraintOfTemplate,
} from '@packages/entity';
import { IEntitySingleProperty } from '@packages/entity-template';
import { IRelationship } from '@packages/relationship';
import { IMongoRule, IRuleMail } from '@packages/rule';
import { IAction, IBrokenRule } from '@packages/rule-breach';
import { ISemanticSearchResult } from '@packages/semantic-search';
import { IGetUnits } from '@packages/unit';
import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    instanceService: {
        url,
        baseEntitiesRoute,
        baseRelationshipsRoute,
        baseBulkActionsRoute,
        baseConstraintsRoute,
        requestTimeout,
        searchOfTemplateRoute,
        searchEntitiesByLocationRoute,
    },
} = config;

class InstancesService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    // entity instances
    async updateEnumFieldOfEntity(id: string, newValue: string, oldValue: string, field: { name: string; type: string }) {
        const { data } = await this.api.put<IEntity>(`${baseEntitiesRoute}/update-enum-field/${id}`, { newValue, oldValue, field });
        return data;
    }

    async getIfValueFieldIsUsed(id: string, fieldValue: string, fieldName: string, type: string) {
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

    async createEntityInstance(
        entity: IEntity,
        ignoredRules: IBrokenRule[],
        userId: string,
        duplicatedFromId?: string,
        childTemplate?: { id: string; filter?: ISearchFilter },
        newDestWalletData?: IEntity,
    ) {
        const { data } = await this.api.post<{ createdEntity: IEntity; actions?: IAction[]; emails?: IRuleMail[] }>(`${baseEntitiesRoute}`, {
            ...entity,
            ignoredRules,
            userId,
            duplicatedFromId,
            childTemplate,
            newDestWalletData,
        });

        return data;
    }

    async updateEntityInstance(
        id: string,
        entity: IEntity,
        ignoredRules: IBrokenRule[],
        userId?: string,
        childTemplate?: { id: string; filter?: ISearchFilter },
        convertToRelationshipField = false,
    ) {
        const { data } = await this.api.put<{ updatedEntity: IEntity; actions?: IAction[]; emails?: IRuleMail[] }>(`${baseEntitiesRoute}/${id}`, {
            ...entity,
            ignoredRules,
            userId,
            childTemplate,
            convertToRelationshipField,
        });

        return data;
    }

    async convertToRelationshipField(existingRelationships: IRelationship[], addFieldToSrcEntity: boolean, fieldName: string, userId: string) {
        const { data } = await this.api.patch<object>(`${baseEntitiesRoute}/convertToRelationshipField/`, {
            existingRelationships,
            addFieldToSrcEntity,
            fieldName,
            userId,
        });

        return data;
    }

    async updateEntityStatus(id: string, disabled: boolean, ignoredRules: IBrokenRule[], userId: string) {
        const { data } = await this.api.patch<IEntity>(`${baseEntitiesRoute}/${id}/status`, { disabled, ignoredRules, userId });

        return data;
    }

    async deleteEntityInstances(deleteBody: IDeleteEntityBody) {
        const { data } = await this.api.post<string[]>(`${baseEntitiesRoute}/delete/bulk`, deleteBody);

        return data;
    }

    async searchEntitiesOfTemplateRequest(templateId: string, searchBody: ISearchEntitiesOfTemplateBody & { entityIdsToInclude?: string[] }) {
        const { data } = await this.api.post<ISearchResult>(`${baseEntitiesRoute}${searchOfTemplateRoute}/${templateId}`, searchBody);

        return data;
    }

    async getEntitiesWithDirectRelationships(searchBody: IMultipleSelect<boolean>, templateId: string) {
        const { data } = await this.api.post<IEntityWithDirectRelationships[]>(`${baseEntitiesRoute}/get/multiple-select`, {
            ...searchBody,
            templateId,
            showRelationships: false,
        });

        return data;
    }

    async searchEntitiesByLocationRequest(searchBody: ISearchEntitiesByLocationBody) {
        const { data } = await this.api.post<{ node: IEntity; matchingFields: string[] }[]>(
            `${baseEntitiesRoute}${searchEntitiesByLocationRoute}`,
            searchBody,
        );

        return data;
    }

    async searchEntitiesBatch(searchBody: ISearchBatchBody & { entityIdsToInclude?: string[] }) {
        const { data } = await this.api.post<ISearchResult>(`${baseEntitiesRoute}/search/batch`, searchBody);

        return data;
    }

    async getEntitiesCountByTemplates(searchBody: ITemplateSearchBody & { semanticSearchResult?: ISemanticSearchResult }) {
        const { data } = await this.api.post<ICountSearchResult[]>(`${baseEntitiesRoute}/count`, searchBody);

        return data;
    }

    async getChartsOfTemplate(templateId: string, body: { chartsData: IChartBody[]; childTemplateId?: string }, units: IGetUnits) {
        const { data } = await this.api.post<{ _id: string; chart: { x: IPropertyValue; y: number }[] }[] | { x: IPropertyValue; y: number }[][]>(
            `${baseEntitiesRoute}/chart/${templateId}`,
            {
                ...body,
                units,
            },
        );

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

    async getRelationshipsByEntitiesAndTemplate(query: { sourceEntityId: string; destinationEntityId: string; templateId: string }) {
        const { data } = await this.api.get<IRelationship[]>(`${baseRelationshipsRoute}`, { params: query });
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

    async convertFieldsToPlural(templateId: string, propertiesKeysToPluralize: string[]) {
        const { data } = await this.api.put(`${baseEntitiesRoute}/convert-fields-to-plural/${templateId}`, { propertiesKeysToPluralize });

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

    async getDependantRules(rules: IMongoRule[], relationshipTemplateId: string): Promise<IMongoRule[]> {
        const { data } = await this.api.post<IMongoRule[]>(`${baseEntitiesRoute}/rules/dependant`, {
            rules,
            relationshipTemplateId,
        });
        return data;
    }

    async runBulkOfActions(
        actionsGroups: IAction[][],
        dryRun: boolean,
        userId: string,
        ignoredRules: IBrokenRule[] = [],
    ): Promise<PromiseSettledResult<IBulkOfActions>[]> {
        const { data } = await this.api.post<PromiseSettledResult<IBulkOfActions>[]>(
            `${baseBulkActionsRoute}/bulk`,
            { actionsGroups, ignoredRules, userId },
            { params: { dryRun } },
        );

        return data;
    }

    async countEntitiesOfTemplatesByUserEntityId(templateIds: string[], userEntityId: string) {
        const { data } = await this.api.post<ICountSearchResult[]>(`${baseEntitiesRoute}/count/user-entity-id`, {
            templateIds,
            userEntityId,
        });
        return data;
    }

    async getExpandedEntityByIdRequest(
        entityId: string,
        expandedParams: { [key: string]: number },
        options?: { templateIds: string[] },
        userId?: string,
    ) {
        const { data } = await this.api.post<IEntityExpanded>(`${baseEntitiesRoute}/expanded/${entityId}`, {
            ...options,
            expandedParams,
            userId,
        });
        return data;
    }

    async runRulesWithTodayFunc() {
        const { data } = await this.api.post<{ brokenRulesOfWarningOnFail: IBrokenRule[] }>(`${baseEntitiesRoute}/runRulesWithTodayFunc`);

        return data;
    }
}

export default InstancesService;
