import axios from 'axios';
import _groupBy from 'lodash.groupby';
import _difference from 'lodash.difference';
import { QueryResult, Transaction } from 'neo4j-driver';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';
import { IBrokenRule, IMongoRelationshipTemplateRule, IRuleRequestSchema, IRuleTransactionQuery, IRuleTransactionResult } from './interfaces';
import { IRelationshipRequestSchema, IMongoRelationshipTemplate, IRelationship } from '../relationships/interface';
import { IEntity } from '../entities/interface';
import { getEntityTemplateById } from '../entities/validator.template';
import { generateNeo4jQuery } from '.';
import config from '../../config';
import { normalizeRelAndEntitiesForRule, normalizeRuleResult } from '../../utils/neo4j/lib';

const { relationshipManager, createdRelationshipIdInBrokenRules } = config;
const { url, searchRulesRoute, searchTemplatesRoute, timeout } = relationshipManager;

export const searchRelationshipTemplates = async (relationshipRequest: IRelationshipRequestSchema) => {
    const { result, err } = await trycatch(() =>
        axios.post<IMongoRelationshipTemplate[]>(`${url}${searchTemplatesRoute}`, relationshipRequest, { timeout }),
    );

    if (err || !result) {
        throw new ValidationError(`Failed to fetch relationship template schemas.`);
    }

    return result.data;
};

const getRelationshipTemplatesById = async (entityTemplateId: string) => {
    const relationshipTemplates = await Promise.all([
        searchRelationshipTemplates({ sourceEntityIds: [entityTemplateId] }),
        searchRelationshipTemplates({ destinationEntityIds: [entityTemplateId] }),
    ]);

    return relationshipTemplates.flat();
};

export const searchRuleTemplates = async (ruleRequest: IRuleRequestSchema) => {
    const { result, err } = await trycatch(() =>
        axios.post<IMongoRelationshipTemplateRule[]>(`${url}${searchRulesRoute}`, { disabled: false, ...ruleRequest }, { timeout }),
    );

    if (err || !result) {
        throw new ValidationError(`Failed to fetch rule template schema.`);
    }

    return result.data;
};

export const getRulesByEntityTemplateId = async (entityTemplateId: string) => {
    const rules = await Promise.all([
        searchRuleTemplates({ pinnedEntityTemplateIds: [entityTemplateId] }),
        searchRuleTemplates({ unpinnedEntityTemplateIds: [entityTemplateId] }),
    ]);

    return rules.flat();
};

export const getBrokenRules = (ruleResults: IRuleTransactionResult[], createdRelationshipId?: string) => {
    const resultsByRuleId = _groupBy(
        ruleResults.filter((ruleResult) => !ruleResult.doesRuleStillApply),
        'ruleId',
    );

    const brokenRules = Object.entries(resultsByRuleId).map(([ruleId, ruleTransactionResults]) => {
        const relationshipIds = ruleTransactionResults.map((ruleTransactionResult) => {
            if (ruleTransactionResult.relationshipId === createdRelationshipId) {
                return createdRelationshipIdInBrokenRules;
            }

            return ruleTransactionResult.relationshipId;
        });

        return { ruleId, relationshipIds };
    });

    return brokenRules;
};

export const areAllBrokenRulesIgnored = (brokenRules: IBrokenRule[], ignoredRules: IBrokenRule[]) => {
    return brokenRules.every((brokenRule) => {
        const ignoredRule = ignoredRules.find(({ ruleId }) => ruleId === brokenRule.ruleId);

        if (!ignoredRule) {
            return false;
        }

        return _difference(brokenRule.relationshipIds, ignoredRule.relationshipIds).length === 0;
    });
};

export const getRuleResults = async (transaction: Transaction, ruleQueries: IRuleTransactionQuery[]): Promise<IRuleTransactionResult[]> => {
    const ruleTransactions = ruleQueries.map(async (ruleTransaction) => {
        const { ruleQuery, ruleId, relationshipId } = ruleTransaction;
        const result = await transaction.run(ruleQuery.cypherQuery, ruleQuery.parameters);

        return { doesRuleStillApply: normalizeRuleResult(result), ruleId, relationshipId };
    });

    return Promise.all(ruleTransactions);
};

export const isRelationshipLegal = async (
    relationship: IRelationship,
    sourceEntity: IEntity,
    destinationEntity: IEntity,
    relationshipTemplateRules: IMongoRelationshipTemplateRule[],
): Promise<IRuleTransactionQuery[]> => {
    const generateNeo4jQueries = relationshipTemplateRules
        .filter(({ relationshipTemplateId }) => relationshipTemplateId === relationship.templateId)
        .map(async (relationshipTemplateRule) => {
            const { pinnedEntityTemplateId } = relationshipTemplateRule;

            const [pinnedEntity, nonPinnedEntity] =
                pinnedEntityTemplateId === sourceEntity.templateId ? [sourceEntity, destinationEntity] : [destinationEntity, sourceEntity];

            const pinnedEntityRelationships = await getRelationshipTemplatesById(pinnedEntityTemplateId);

            const connectionsTemplates = await Promise.all(
                pinnedEntityRelationships.map(async (relTemplate) => {
                    const { sourceEntityId, destinationEntityId } = relTemplate;
                    const unpinnedEntityTemplateId = sourceEntityId === pinnedEntity.templateId ? destinationEntityId : sourceEntityId;

                    const unpinnedEntityTemplate = await getEntityTemplateById(unpinnedEntityTemplateId);

                    return { relationshipTemplate: relTemplate, unpinnedEntityTemplate };
                }),
            );

            const ruleQuery = generateNeo4jQuery(
                relationshipTemplateRule,
                pinnedEntity.properties._id,
                nonPinnedEntity.properties._id,
                relationship.properties._id,
                pinnedEntity.templateId,
                nonPinnedEntity.templateId,
                connectionsTemplates,
            );

            return {
                ruleQuery,
                relationshipId: relationship.properties._id as string,
                ruleId: relationshipTemplateRule._id,
            };
        });

    return Promise.all(generateNeo4jQueries);
};

export const createRuleQuery = (queryResult: QueryResult, rules: IMongoRelationshipTemplateRule[]) => {
    return normalizeRelAndEntitiesForRule(queryResult).map((path) =>
        isRelationshipLegal(path.relationship, path.sourceEntity, path.destinationEntity, rules),
    );
};
