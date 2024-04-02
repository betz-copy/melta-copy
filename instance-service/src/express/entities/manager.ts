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
    IRequiredConstraint,
    ISearchBatchBody,
    ISearchEntitiesOfTemplateBody,
    IUniqueConstraint,
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

    static async createEntityOnTransaction(transaction: Transaction, entity: IEntity, entityTemplate: IMongoEntityTemplate) {
        const { templateId, properties } = entity;

        return runInTransactionAndNormalize(
            transaction,
            `CREATE (e: \`${templateId}\` $properties) RETURN e`,
            normalizeReturnedEntity('singleResponseNotNullable'),
            {
                properties: {
                    ...generateDefaultProperties(),
                    ...addStringFieldsAndNormalizeDateValues(properties, entityTemplate),
                },
            },
        ).catch(EntityManager.throwServiceErrorIfFailedConstraintsValidation);
    }

    static async createEntity(entity: IEntity, entityTemplate: IMongoEntityTemplate) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            return EntityManager.createEntityOnTransaction(transaction, entity, entityTemplate);
        });
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
    static async getExpandedEntityById(id: string, disabled: boolean | null, templateIds: string[], numOfConnections: number) {
        const nodeAndConnections = await Neo4jClient.readTransaction(
            `MATCH (p {_id:'${id}'})
             CALL apoc.path.expandConfig(p, {
                labelFilter: '${templateIds.join('|')}',
                minLevel: 0,
                maxLevel: ${numOfConnections}
             })
             YIELD path
             RETURN apoc.path.elements(path)`,
            normalizeReturnedRelAndEntities(disabled),
        );

        if (!nodeAndConnections) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return nodeAndConnections;
    }

    static async deleteEntityById(id: string, deleteAllRelationships: boolean) {
        try {
            const node = await Neo4jClient.writeTransaction(
                `MATCH (e {_id: '${id}'}) ${deleteAllRelationships ? 'DETACH' : ''} DELETE e RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );

            if (!node) {
                throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
            }

            return id;
        } catch (error) {
            if (error instanceof Neo4jError && error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                throw new ServiceError(400, `[NEO4J] entity "${id}" has existing relationships. Delete them first.`, {
                    errorCode: config.errorCodes.entityHasRelationships,
                });
            }

            throw error;
        }
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

    static async updateEntityById(
        id: string,
        entityProperties: Record<string, any>,
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
    ) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
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
                `MATCH (e {_id: $props._id})
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
        }).catch(EntityManager.throwServiceErrorIfFailedConstraintsValidation); // constraint validation is performed on end of transaction
    }

    private static getConstraintFromName(constraintName: string): IConstraint {
        const [constraintTypePrefix, constraintTemplateId, ...properties] = constraintName.split(config.constraintsNameDelimiter);

        switch (constraintTypePrefix) {
            case config.requiredConstraintsPrefixName: {
                return { constraintName, type: 'REQUIRED', templateId: constraintTemplateId, property: properties[0] };
            }
            case config.uniqueConstraintsPrefixName: {
                return { constraintName, type: 'UNIQUE', templateId: constraintTemplateId, properties };
            }
            default:
                throw new Error('unknown constraint type for template (checked by constraint name)');
        }
    }

    private static buildConstraintsOfTemplate(templateId: string, constraints: IConstraint[]) {
        return constraints.reduce<IConstraintsOfTemplate>(
            (acc, curr) => ({
                ...acc,
                requiredConstraints: curr.type === 'REQUIRED' ? [...acc.requiredConstraints, curr.property] : acc.requiredConstraints,
                uniqueConstraints: curr.type === 'UNIQUE' ? [...acc.uniqueConstraints, curr.properties] : acc.uniqueConstraints,
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
        uniqueConstraintsProps: string[][],
        existingUniqueConstraints: IUniqueConstraint[],
    ) {
        const existingUniqueConstraintsOfTemplate = existingUniqueConstraints.filter((constraint) => constraint.templateId === templateId);

        const newUniqueConstraints: IUniqueConstraint[] = uniqueConstraintsProps.map((uniqueConstraintProps) => ({
            type: 'UNIQUE',
            constraintName: `${config.uniqueConstraintsPrefixName}${config.constraintsNameDelimiter}${templateId}${
                config.constraintsNameDelimiter
            }${uniqueConstraintProps.join(config.constraintsNameDelimiter)}`,
            templateId,
            properties: uniqueConstraintProps,
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
            const propsPart = constraint.properties.map((prop) => `n.${prop}`).join(', ');

            await transaction
                .run(`CREATE CONSTRAINT \`${constraint.constraintName}\` ON (n:\`${templateId}\`) ASSERT (${propsPart}) IS NODE KEY`)
                .catch((err) => EntityManager.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingUniqueConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        await Promise.all([...createUniqueConstraintsPromises, ...deleteConstraintsPromises]);
    }

    static async updateConstraintsOfTemplate(templateId: string, constraints: { requiredConstraints: string[]; uniqueConstraints: string[][] }) {
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
}

export default EntityManager;
