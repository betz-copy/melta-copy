/* eslint-disable no-await-in-loop */
import { Neo4jError, Transaction } from 'neo4j-driver';
import pickBy from 'lodash.pickby';
import differenceWith from 'lodash.differencewith';
import groupBy from 'lodash.groupby';
import mapValues from 'lodash.mapvalues';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeReturnedRelAndEntities,
    normalizeReturnedEntity,
    normalizeResponseCount,
    normalizeRelAndEntitiesForRule,
    normalizeGetDbConstraints,
    runInTransactionAndNormalize,
    normalizeSearchWithRelationships,
} from '../../utils/neo4j/lib';
import {
    IConstraint,
    IConstraintsOfTemplate,
    IEntity,
    IGetExpandedEntityBody,
    IRequiredConstraint,
    ISearchBatchBody,
    ISearchEntitiesOfTemplateBody,
    IUniqueConstraint,
    IUniqueConstraintOfTemplate,
} from './interface';
import { NotFoundError, ServiceError } from '../error';
import { getLatestGlobalSearchIndex, getLatestTemplateSearchIndex } from '../../utils/redis/getLatestIndex';
import { runRulesOnRelationship, runRulesOnRelationshipsOfPinnedEntity, throwIfActionCausedBrokenRules } from '../rules/lib';
import { IBrokenRule, IConnection, IRuleFailureWithCauses } from '../rules/interfaces';
import { filterDependentRulesOnProperties, filterDependentRulesViaAggregation } from '../rules/getParametersOfFormula';
import config from '../../config';
import { EntityTemplateManagerService, IEntitySingleProperty, IMongoEntityTemplate } from '../../externalServices/entityTemplateManager';
import { RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';
import { addStringFieldsAndNormalizeDateValues } from './validator.template';
import { arraysEqualsNonOrdered } from '../../utils/lib';
import { searchWithRelationshipsToNeoQuery } from '../../utils/neo4j/searchBodyToNeoQuery';
import { getExpandedFilteredGraphRecursively, expandEntityToNeoQuery } from '../../utils/neo4j/getExpandedEntityByIdRecursive';
import { executeScriptInTransaction } from '../../utils/actions/executeScript';

export class EntityManager {
    private static throwServiceErrorIfFailedConstraintsValidation(err: unknown): never {
        if (!(err instanceof Neo4jError) || err.code !== 'Neo.ClientError.Schema.ConstraintValidationFailed') {
            throw err;
        }

        const { message: neo4jMessage } = err;

        if (neo4jMessage.includes('must have the property')) {
            // neo4jMessage = Node(...) with label `someLabel...` must have the property `property1`
            const variableMatchesInMessage = neo4jMessage.matchAll(/`(.*?)`/g)!;
            const [label, property] = Array.from(variableMatchesInMessage).map((match) => match[1]);

            const requiredConstraint: Omit<IRequiredConstraint, 'constraintName'> = {
                type: 'REQUIRED',
                templateId: label,
                property,
            };
            throw new ServiceError(400, `[NEO4J] instance is missing required property`, {
                errorCode: config.errorCodes.failedConstraintsValidation,
                constraint: requiredConstraint,
                neo4jMessage,
            });
        } else if (neo4jMessage.includes('already exists with')) {
            // neo4jMessage = Node(...) already exists with label `someLabel...` and properties `property1` = ..., `property2` = ...
            // support unique w/ multiple props
            const variableMatchesInMessage = neo4jMessage.matchAll(/`(.*?)`/g)!;
            const [label, ...properties] = Array.from(variableMatchesInMessage).map((match) => match[1]);

            const uniqueConstraint: Omit<IUniqueConstraint, 'constraintName'> = {
                type: 'UNIQUE',
                templateId: label,
                uniqueGroupName: '',
                properties,
            };

            throw new ServiceError(400, `[NEO4J] instance has duplicates on unique properties`, {
                errorCode: config.errorCodes.failedConstraintsValidation,
                constraint: uniqueConstraint,
                neo4jMessage,
            });
        } else {
            // unsupported constraint validation error. possibly neo4j broke expected message
            throw err;
        }
    }

    static async createEntity(
        entity: IEntity,
        entityTemplate: IMongoEntityTemplate,
    ): Promise<{ createdEntity: IEntity; updatedEntities: IEntity[] }> {
        const { templateId, properties } = entity;
        const updatedEntities: IEntity[] = [];

        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const createdEntity: IEntity = await runInTransactionAndNormalize(
                transaction,
                `CREATE (e: \`${templateId}\` $properties) RETURN e`,
                normalizeReturnedEntity('singleResponseNotNullable'),
                {
                    properties: {
                        ...generateDefaultProperties(),
                        ...addStringFieldsAndNormalizeDateValues(properties, entityTemplate),
                    },
                },
            );

            if (entityTemplate.actions) {
                const updatedEntitiesInActionExecution = await executeScriptInTransaction(
                    entityTemplate,
                    createdEntity,
                    'onCreateEntity',
                    transaction,
                    [],
                );
                updatedEntities.push(...updatedEntitiesInActionExecution);
                return { createdEntity, updatedEntities };
            }

            return { createdEntity, updatedEntities };
        }).catch(EntityManager.throwServiceErrorIfFailedConstraintsValidation);
    }

    static async searchEntitiesOfTemplate(searchBody: ISearchEntitiesOfTemplateBody, entityTemplate: IMongoEntityTemplate) {
        let latestIndex: string | null = null;

        if (searchBody.textSearch) {
            latestIndex = await getLatestTemplateSearchIndex(entityTemplate._id);

            if (!latestIndex) {
                throw new ServiceError(400, `[NEO4J] Global search index not found.`);
            }
        }

        const searchBodyOfTemplate: ISearchBatchBody = {
            skip: searchBody.skip,
            limit: searchBody.limit,
            textSearch: searchBody.textSearch,
            templates: {
                [entityTemplate._id]: { filter: searchBody.filter, showRelationships: searchBody.showRelationships },
            },
            sort: searchBody.sort,
        };

        const searchCypherQuery = searchWithRelationshipsToNeoQuery(
            searchBodyOfTemplate,
            latestIndex,
            new Map([[entityTemplate._id, entityTemplate]]),
        );
        const searchCountCypherQuery = searchWithRelationshipsToNeoQuery(
            searchBodyOfTemplate,
            latestIndex,
            new Map([[entityTemplate._id, entityTemplate]]),
            true,
        );

        const [entities, count] = await Promise.all([
            Neo4jClient.readTransaction(searchCypherQuery.cypherQuery, normalizeSearchWithRelationships, searchCypherQuery.parameters),
            Neo4jClient.readTransaction(searchCountCypherQuery.cypherQuery, normalizeResponseCount, searchCountCypherQuery.parameters),
        ]);

        return { entities, count };
    }

    static async searchEntitiesBatch(searchBody: ISearchBatchBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) {
        let latestIndex: string | null = null;
        if (searchBody.textSearch) {
            latestIndex = await getLatestGlobalSearchIndex();

            if (!latestIndex) {
                throw new ServiceError(400, `[NEO4J] Global search index not found.`);
            }
        }

        const searchCypherQuery = searchWithRelationshipsToNeoQuery(searchBody, latestIndex, entityTemplatesMap);
        const searchCountCypherQuery = searchWithRelationshipsToNeoQuery(searchBody, latestIndex, entityTemplatesMap, true);

        const [entities, count] = await Promise.all([
            Neo4jClient.readTransaction(searchCypherQuery.cypherQuery, normalizeSearchWithRelationships, searchCypherQuery.parameters),
            Neo4jClient.readTransaction(searchCountCypherQuery.cypherQuery, normalizeResponseCount, searchCountCypherQuery.parameters),
        ]);

        return { entities, count };
    }

    static async getEntityById(id: string) {
        const node = await Neo4jClient.readTransaction(`MATCH (e {_id: '${id}'}) RETURN e`, normalizeReturnedEntity('singleResponse'));

        if (!node) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return node;
    }

    static async getExpandedGraphById(id: string, reqBody: IGetExpandedEntityBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) {
        const { disabled, templateIds, expandedParams, filters } = reqBody;
        const fixSearchBody = filters ?? {};
        const initialCypherQuery = await expandEntityToNeoQuery(fixSearchBody, id, templateIds, expandedParams, entityTemplatesMap, id);
        const initialExpandedEntity = await Neo4jClient.readTransaction(
            initialCypherQuery.cypherQuery,
            normalizeReturnedRelAndEntities(disabled),
            initialCypherQuery.parameters,
        );
        if (!initialExpandedEntity) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }
        if (JSON.stringify(expandedParams) === '{}') {
            return initialExpandedEntity;
        }

        const filterRes = await getExpandedFilteredGraphRecursively(
            disabled || null,
            initialExpandedEntity,
            fixSearchBody,
            templateIds,
            expandedParams,
            entityTemplatesMap,
        );
        return filterRes;
    }

    static async deleteEntityById(id: string, deleteAllRelationships: boolean) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            try {
                // const entity = await this.getEntityById(id);
                // const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);

                const node = await runInTransactionAndNormalize(
                    transaction,
                    `MATCH (e {_id: '${id}'}) ${deleteAllRelationships ? 'DETACH' : ''} DELETE e RETURN e`,
                    normalizeReturnedEntity('singleResponse'),
                );

                if (!node) {
                    throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
                }

                // const result = executeScript(entityTemplate, entity, 'onDeleteEntity');
                // try {
                //     await Promise.all(
                //         result.map(async (updatedEntity) => {
                //             await validateEntity(entityTemplate._id, updatedEntity.properties);
                //             this.updateEntityByIdInnerTrans(updatedEntity.entityId, updatedEntity.properties, entityTemplate, [], transaction);
                //         }),
                //     );
                // } catch (error) {
                //     logger.error(`error updating instances ${error}`);
                // }
                return id;
            } catch (error) {
                if (error instanceof Neo4jError && error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                    throw new ServiceError(400, `[NEO4J] entity "${id}" has existing relationships. Delete them first.`, {
                        errorCode: config.errorCodes.entityHasRelationships,
                    });
                }

                throw error;
            }
        });
    }

    static async getIsFieldUsed(id: string, fieldValue: string, fieldName: string, type: string) {
        let node;
        if (type === 'array') {
            node = await Neo4jClient.readTransaction(
                `MATCH (e: \`${id}\`) WHERE '${fieldValue}' IN e.${fieldName} RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );
        } else {
            node = await Neo4jClient.readTransaction(
                `MATCH (e: \`${id}\`) WHERE e.${fieldName} = '${fieldValue}' RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );
        }
        return node;
    }

    static async deleteByTemplateId(templateId: string) {
        return Neo4jClient.writeTransaction(`MATCH (e: \`${templateId}\`) DETACH DELETE e`, normalizeReturnedEntity('multipleResponses'));
    }

    static async updateStatusById(id: string, disabled: boolean, ignoredRules: IBrokenRule[]) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const entity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'}) RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );

            if (!entity) {
                throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
            }

            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);
            const updatedProperties = EntityManager.getUpdatedProperties(
                entity,
                { ...entity, properties: { ...entity.properties, disabled, updatedAt: new Date().toISOString() } },
                entityTemplate,
            );

            const ruleFailuresBeforeAction = await EntityManager.runRulesDependOnEntityUpdate(transaction, entity, updatedProperties);

            const updatedEntity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'}) SET e.disabled = $disabled RETURN e`,
                normalizeReturnedEntity('singleResponseNotNullable'),
                { disabled },
            );

            const ruleFailuresAfterAction = await EntityManager.runRulesDependOnEntityUpdate(transaction, updatedEntity, updatedProperties);

            throwIfActionCausedBrokenRules(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction);

            return updatedEntity;
        });
    }

    private static runRulesOnAllRelationshipsOfUpdatedEntity = async (
        transaction: Transaction,
        connectionsOfEntity: IConnection[],
        entity: IEntity,
        updatedProperties: string[],
    ): Promise<IRuleFailureWithCauses[]> => {
        const rulesOfEntityWhenPinned = await RelationshipsTemplateManagerService.searchRules({
            pinnedEntityTemplateIds: [entity.templateId],
        });
        const rulesOfEntityWhenUnpinned = await RelationshipsTemplateManagerService.searchRules({
            unpinnedEntityTemplateIds: [entity.templateId],
        });
        const rulesOfEntity = [...rulesOfEntityWhenPinned, ...rulesOfEntityWhenUnpinned];
        const relevantRulesOfEntity = filterDependentRulesOnProperties(rulesOfEntity, entity.templateId, updatedProperties);

        const ruleFailuresForEachConnectionPromises = connectionsOfEntity.map(async ({ relationship, destinationEntity: neighbourOfEntity }) => {
            const relevantRulesOfRelationship = relevantRulesOfEntity.filter(
                ({ relationshipTemplateId }) => relationshipTemplateId === relationship.templateId,
            );

            const sourceEntityTemplateId = entity.properties._id === relationship.sourceEntityId ? entity.templateId : neighbourOfEntity.templateId;
            return runRulesOnRelationship(
                transaction,
                relevantRulesOfRelationship,
                relationship.sourceEntityId,
                relationship.destinationEntityId,
                relationship.properties._id,
                sourceEntityTemplateId,
            );
        });
        const ruleFailuresForEachConnection = await Promise.all(ruleFailuresForEachConnectionPromises);
        const ruleFailures = ruleFailuresForEachConnection.flat();

        return ruleFailures.map((ruleFailure) => ({ ...ruleFailure, isTriggeredViaAggregation: false }));
    };

    private static runRulesOnRelationshipsOfNeighboursOfEntityDependentViaAggregation = async (
        transaction: Transaction,
        connectionsOfDependent: IConnection[],
        dependentEntity: IEntity,
        updatedProperties: string[],
    ): Promise<IRuleFailureWithCauses[]> => {
        const ruleFailuresForEachConnectionPromises = connectionsOfDependent.map(async ({ relationship, destinationEntity: neighbourOfEntity }) => {
            const rulesOfPinnedEntity = await RelationshipsTemplateManagerService.searchRules({
                pinnedEntityTemplateIds: [neighbourOfEntity.templateId],
            });

            const rulesDependentViaAggregation = filterDependentRulesViaAggregation(rulesOfPinnedEntity, relationship.templateId, updatedProperties);

            return runRulesOnRelationshipsOfPinnedEntity(
                transaction,
                neighbourOfEntity.properties._id,
                rulesDependentViaAggregation,
                dependentEntity.properties._id,
            );
        });

        const ruleFailuresForEachConnection = await Promise.all(ruleFailuresForEachConnectionPromises);
        const ruleFailures = ruleFailuresForEachConnection.flat();

        return ruleFailures.map((ruleFailure) => ({ ...ruleFailure, isTriggeredViaAggregation: true }));
    };

    private static async runRulesDependOnEntityUpdate(transaction: Transaction, updatedEntity: IEntity, updatedProperties: string[]) {
        const connectionsOfEntity = await runInTransactionAndNormalize(
            transaction,
            `MATCH (s {_id: '${updatedEntity.properties._id}'})-[r]-(d)  RETURN s, r, d`,
            normalizeRelAndEntitiesForRule,
        );

        const ruleFailuresOnAllRelationshipsOfUpdatedEntityPromise = EntityManager.runRulesOnAllRelationshipsOfUpdatedEntity(
            transaction,
            connectionsOfEntity,
            updatedEntity,
            updatedProperties,
        );

        const ruleFailuresOnRelationshipsOfNeighboursOfEntityPromise =
            EntityManager.runRulesOnRelationshipsOfNeighboursOfEntityDependentViaAggregation(
                transaction,
                connectionsOfEntity,
                updatedEntity,
                updatedProperties,
            );

        const [ruleFailuresOnAllRelationshipsOfUpdatedEntity, ruleFailuresOnRelationshipsOfNeighboursOfEntity] = await Promise.all([
            ruleFailuresOnAllRelationshipsOfUpdatedEntityPromise,
            ruleFailuresOnRelationshipsOfNeighboursOfEntityPromise,
        ]);
        const ruleFailures = [...ruleFailuresOnAllRelationshipsOfUpdatedEntity, ...ruleFailuresOnRelationshipsOfNeighboursOfEntity];

        return ruleFailures;
    }

    public static getUpdatedProperties(oldEntity: IEntity, newEntity: IEntity, entityTemplate: IMongoEntityTemplate) {
        const propertiesWithGeneratedProperties: Record<string, IEntitySingleProperty> = {
            ...entityTemplate.properties.properties,
            disabled: { title: 'doesntMatter', type: 'boolean' },
            createdAt: { title: 'doesntMatter', type: 'string', format: 'date-time' },
            updatedAt: { title: 'doesntMatter', type: 'string', format: 'date-time' },
        };
        const templateUpdatedProperties = pickBy(propertiesWithGeneratedProperties, (_propertyTemplate, key) => {
            return newEntity.properties[key] !== oldEntity.properties[key];
        });

        const updatedProperties = Object.keys(templateUpdatedProperties);
        return updatedProperties;
    }

    static async updateEntityByIdInnerTrans(
        id: string,
        entityProperties: Record<string, any>,
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
        transaction: Transaction,
    ) {
        console.log(id, entityProperties);

        const entity = await runInTransactionAndNormalize(
            transaction,
            `MATCH (e {_id: '${id}'}) RETURN e`,
            normalizeReturnedEntity('singleResponse'),
        );

        if (!entity) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        if (entity.properties.disabled) {
            throw new ServiceError(400, `[NEO4J] cannot update disabled entity.`);
        }

        const updatedProperties = EntityManager.getUpdatedProperties(
            entity,
            { templateId: entity.templateId, properties: { ...entityProperties, updatedAt: new Date().toISOString() } },
            entityTemplate,
        );
        const ruleFailuresBeforeAction = await EntityManager.runRulesDependOnEntityUpdate(transaction, entity, updatedProperties);
        const updatedEntity = await runInTransactionAndNormalize(
            transaction,
            `MATCH (e {_id: '${id}'})
             WITH e.createdAt AS createdAt, e.disabled AS disabled, e AS e
             SET e = $props 
             SET e.createdAt = createdAt
             SET e.disabled = disabled
             RETURN e`,
            normalizeReturnedEntity('singleResponseNotNullable'),
            {
                props: {
                    ...addStringFieldsAndNormalizeDateValues(entityProperties, entityTemplate),
                    updatedAt: getNeo4jDateTime(),
                    _id: id,
                },
            },
        );
        const ruleFailuresAfterAction = await EntityManager.runRulesDependOnEntityUpdate(transaction, updatedEntity, updatedProperties);
        throwIfActionCausedBrokenRules(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction);
        return updatedEntity;
    }

    static async updateEntityById(
        id: string,
        entityProperties: Record<string, any>,
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
    ) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const updatedInstance = await this.updateEntityByIdInnerTrans(id, entityProperties, entityTemplate, ignoredRules, transaction);

            if (updatedInstance && entityTemplate.actions) {
                const entitiesToUpdate = executeScriptInTransaction(entityTemplate, updatedInstance, 'onUpdateEntity', transaction, ignoredRules);
                return entitiesToUpdate;
            }

            return [updatedInstance];
        }).catch(EntityManager.throwServiceErrorIfFailedConstraintsValidation); // constraint validation is performed on end of transaction
    }

    static async updateEnumFieldValue(id: string, newValue: string, oldValue: string, field: any) {
        let node;
        try {
            if (field.type === 'array') {
                node = await Neo4jClient.writeTransaction(
                    `MATCH (e: \`${id}\`)
                    SET e.${field.name} = [val IN e.${field.name} WHERE val <> '${oldValue}'] + ['${newValue}']
                    RETURN e`,
                    normalizeReturnedEntity('singleResponse'),
                );
            } else {
                node = await Neo4jClient.writeTransaction(
                    `MATCH (e: \`${id}\`)
                WHERE e.${field.name} = '${oldValue}'
                SET e.${field.name} = '${newValue}'
                RETURN e`,
                    normalizeReturnedEntity('singleResponse'),
                );
            }
            return node;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundError(`[NEO4J] entity not found`);
            } else {
                throw new Error('Change failed');
            }
        }
    }

    private static getConstraintFromName(constraintName: string): IConstraint {
        const [constraintTypePrefix, ...parts] = constraintName.split(config.constraintsNameDelimiter);

        switch (constraintTypePrefix) {
            case config.requiredConstraint: {
                const [constraintTemplateId, property] = parts;
                return { constraintName, type: 'REQUIRED', templateId: constraintTemplateId, property };
            }
            case config.uniqueConstraint: {
                // if field isnt part of unique group -> constraintName has only two parts (groupName === '')
                const [groupName, constraintTemplateId, propertiesStr] = parts.length === 3 ? parts : ['', ...parts];
                const properties = propertiesStr.split(',');
                return { constraintName, type: 'UNIQUE', templateId: constraintTemplateId, uniqueGroupName: groupName, properties };
            }
            default:
                throw new Error('Unknown constraint type for template (checked by constraint name)');
        }
    }

    private static buildConstraintsOfTemplate(templateId: string, constraints: IConstraint[]) {
        return constraints.reduce<IConstraintsOfTemplate>(
            (acc, curr) => ({
                ...acc,
                requiredConstraints: curr.type === 'REQUIRED' ? [...acc.requiredConstraints, curr.property] : acc.requiredConstraints,
                uniqueConstraints:
                    curr.type === 'UNIQUE'
                        ? [...acc.uniqueConstraints, { groupName: curr.uniqueGroupName, properties: curr.properties }]
                        : acc.uniqueConstraints,
            }),
            {
                templateId,
                requiredConstraints: [],
                uniqueConstraints: [],
            },
        );
    }

    static async getConstraintsOfTemplate(templateId: string) {
        const constraints = await Neo4jClient.readTransaction('call db.constraints', normalizeGetDbConstraints);
        const constraintsArrayOfTemplate = constraints
            .filter(({ name }) => {
                return name.startsWith(config.requiredConstraintsPrefixName) || name.startsWith(config.uniqueConstraintsPrefixName);
            })
            .map(({ name }) => EntityManager.getConstraintFromName(name))
            .filter((constraint) => templateId === constraint.templateId);

        return EntityManager.buildConstraintsOfTemplate(templateId, constraintsArrayOfTemplate);
    }

    static async getAllConstraints() {
        const neo4jConstraints = await Neo4jClient.readTransaction('call db.constraints', normalizeGetDbConstraints);
        const constraints = neo4jConstraints
            .filter(({ name }) => {
                return name.startsWith(config.requiredConstraintsPrefixName) || name.startsWith(config.uniqueConstraintsPrefixName);
            })
            .map(({ name }) => EntityManager.getConstraintFromName(name));

        const constraintsByTemplateIds = groupBy(constraints, 'templateId');
        const constraintsOfTemplates = Object.values(
            mapValues(constraintsByTemplateIds, (constraintsArray, templateId) => {
                return EntityManager.buildConstraintsOfTemplate(templateId, constraintsArray);
            }),
        );

        return constraintsOfTemplates;
    }

    private static throwServiceErrorIfFailedToCreateConstraint(err: unknown, constraint: IConstraint) {
        if (err instanceof Neo4jError && err.code === 'Neo.DatabaseError.Schema.ConstraintCreationFailed') {
            throw new ServiceError(400, `[NEO4J] failed to create constraint due to existing invalid data`, {
                errorCode: config.errorCodes.failedToCreateConstraints,
                constraint,
                neo4jMessage: err.message,
            });
        }
        throw err;
    }

    private static async updateRequiredConstraintsOfTemplate(
        transaction: Transaction,
        templateId: string,
        requiredConstraintsProps: string[],
        existingRequiredConstraints: IRequiredConstraint[],
    ) {
        const existingRequiredConstraintsOfTemplate = existingRequiredConstraints.filter((constraint) => constraint.templateId === templateId);

        const newRequiredConstraints: IRequiredConstraint[] = requiredConstraintsProps.map((requiredConstraintProp) => ({
            type: 'REQUIRED',
            constraintName: `${config.requiredConstraintsPrefixName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${requiredConstraintProp}`,
            templateId,
            property: requiredConstraintProp,
        }));

        const requiredConstraintsToCreate = differenceWith(
            newRequiredConstraints,
            existingRequiredConstraintsOfTemplate,
            (constraintA, constraintB) => constraintA.property === constraintB.property,
        );

        const existingRequiredConstraintsToDelete = differenceWith(
            existingRequiredConstraintsOfTemplate,
            newRequiredConstraints,
            (constraintA, constraintB) => constraintA.property === constraintB.property,
        );

        const createRequiredConstraintsPromises = requiredConstraintsToCreate.map(async (constraint) => {
            await transaction
                .run(`CREATE CONSTRAINT \`${constraint.constraintName}\` ON (n:\`${templateId}\`) ASSERT exists(n.${constraint.property})`)
                .catch((err) => EntityManager.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingRequiredConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        return Promise.all([...createRequiredConstraintsPromises, ...deleteConstraintsPromises]);
    }

    private static async updateUniqueConstraintsOfTemplate(
        transaction: Transaction,
        templateId: string,
        uniqueConstraints: IUniqueConstraintOfTemplate[],
        existingUniqueConstraints: IUniqueConstraint[],
    ) {
        const existingUniqueConstraintsOfTemplate = existingUniqueConstraints.filter((constraint) => constraint.templateId === templateId);

        const newUniqueConstraints: IUniqueConstraint[] = uniqueConstraints.flatMap((constraintGroup) => ({
            type: 'UNIQUE',
            constraintName:
                constraintGroup.groupName === ''
                    ? `${config.uniqueConstraintsPrefixName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${constraintGroup.properties}`
                    : `${config.uniqueConstraintsPrefixName}${config.constraintsNameDelimiter}${constraintGroup.groupName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${constraintGroup.properties}`,
            templateId,
            uniqueGroupName: constraintGroup.groupName,
            properties: constraintGroup.properties,
        }));

        const uniqueConstraintsToCreate = differenceWith(newUniqueConstraints, existingUniqueConstraintsOfTemplate, (constraintA, constraintB) =>
            arraysEqualsNonOrdered(constraintA.properties, constraintB.properties),
        );

        const existingUniqueConstraintsToDelete = differenceWith(
            existingUniqueConstraintsOfTemplate,
            newUniqueConstraints,
            (constraintA, constraintB) => arraysEqualsNonOrdered(constraintA.properties, constraintB.properties),
        );

        const createUniqueConstraintsPromises = uniqueConstraintsToCreate.map(async (constraint) => {
            const propsPart = constraint.properties.map((prop) => `n.${prop}`);

            await transaction
                .run(`CREATE CONSTRAINT \`${constraint.constraintName}\` ON (n:\`${templateId}\`) ASSERT (${propsPart}) IS NODE KEY`)
                .catch((err) => EntityManager.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingUniqueConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        await Promise.all([...createUniqueConstraintsPromises, ...deleteConstraintsPromises]);
    }

    static async updateConstraintsOfTemplate(
        templateId: string,
        constraints: { requiredConstraints: string[]; uniqueConstraints: IUniqueConstraintOfTemplate[] },
    ) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const existingNeo4jConstraints = await runInTransactionAndNormalize(transaction, 'call db.constraints', normalizeGetDbConstraints);

            const updateConstraintsPromises: Promise<any>[] = [];

            const existingRequiredConstraints = existingNeo4jConstraints
                .filter(({ name }) => name.startsWith(config.requiredConstraintsPrefixName))
                .map(({ name }) => EntityManager.getConstraintFromName(name) as IRequiredConstraint);

            const updateRequiredConstraintsPromise = EntityManager.updateRequiredConstraintsOfTemplate(
                transaction,
                templateId,
                constraints.requiredConstraints,
                existingRequiredConstraints,
            );
            updateConstraintsPromises.push(updateRequiredConstraintsPromise);

            const existingUniqueConstraints = existingNeo4jConstraints
                .filter(({ name }) => name.startsWith(config.uniqueConstraintsPrefixName))
                .map(({ name }) => EntityManager.getConstraintFromName(name) as IUniqueConstraint);

            const updateUniqueConstraintsPromise = EntityManager.updateUniqueConstraintsOfTemplate(
                transaction,
                templateId,
                constraints.uniqueConstraints,
                existingUniqueConstraints,
            );
            updateConstraintsPromises.push(updateUniqueConstraintsPromise);

            await Promise.all(updateConstraintsPromises);
        });
    }

    static async enumerateNewSerialNumberFields(templateId: string, newSerialNumberFields: object) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const numOfEntitiesUpdated = `
            MATCH (n: \`${templateId}\`) 
            WITH n
            ORDER BY n.createdAt
            WITH collect(n) AS entities
            UNWIND range(0, size(entities)-1) AS index
            WITH entities[index] AS currentEntity,  index AS currentIndex
            SET ${Object.entries(newSerialNumberFields)
                .map(([key, value]) => `\`currentEntity\`.${key} = toFloat(currentIndex + ${value})`)
                .join(', ')}
            RETURN count(currentEntity) AS numEntitiesUpdated`;
            return runInTransactionAndNormalize(transaction, numOfEntitiesUpdated, normalizeResponseCount);
        });
    }
}

export default EntityManager;
