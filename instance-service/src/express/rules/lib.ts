import _groupBy from 'lodash.groupby';
import _difference from 'lodash.difference';
import { Transaction } from 'neo4j-driver';
import { IBrokenRule, IMongoRule, IRuleTransactionResult } from './interfaces';
import { generateNeo4jRuleQueryAgainstPair, generateNeo4jRuleQueryAgainstPinnedEntity } from './generateRuleNeo4jQuery';
import config from '../../config';
import { EntityTemplateManagerService } from '../../externalServices/entityTemplateManager';
import { RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';
import { normalizeRuleResultAgainstPair, normalizeRuleResultsAgainstPinnedEntity, runInTransactionAndNormalize } from '../../utils/neo4j/lib';
import { IRelationship } from '../relationships/interface';

const { createdRelationshipIdInBrokenRules } = config;

const getRelationshipTemplatesOfEntityTemplate = async (entityTemplateId: string) => {
    const relationshipTemplates = await Promise.all([
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ sourceEntityIds: [entityTemplateId] }),
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: [entityTemplateId] }),
    ]);

    return relationshipTemplates.flat();
};

export const getRulesByEntityTemplateId = async (entityTemplateId: string) => {
    const rules = await Promise.all([
        RelationshipsTemplateManagerService.searchRules({ pinnedEntityTemplateIds: [entityTemplateId] }),
        RelationshipsTemplateManagerService.searchRules({ unpinnedEntityTemplateIds: [entityTemplateId] }),
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

export const getRelevantTemplatesOfRule = async (rule: IMongoRule) => {
    const pinnedEntityRelationshipTemplates = await getRelationshipTemplatesOfEntityTemplate(rule.pinnedEntityTemplateId);

    const connectionsTemplates = await Promise.all(
        pinnedEntityRelationshipTemplates.map(async (relationshipTemplate) => {
            const { sourceEntityId, destinationEntityId } = relationshipTemplate;
            const otherEntityTemplateId = sourceEntityId === rule.pinnedEntityTemplateId ? destinationEntityId : sourceEntityId;

            const otherEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(otherEntityTemplateId);

            return { relationshipTemplate, otherEntityTemplate };
        }),
    );

    const relationshipTemplateOfRule = connectionsTemplates.find(({ relationshipTemplate: { _id } }) => _id === rule.relationshipTemplateId)!;

    return {
        pinnedEntityTemplateId: rule.pinnedEntityTemplateId,
        unpinnedEntityTemplateId: relationshipTemplateOfRule.otherEntityTemplate._id,
        connectionsTemplates,
    };
};

export const runRuleOnRelationshipsOfPinnedEntity = async (transaction: Transaction, pinnedEntityId: string, rule: IMongoRule) => {
    const relevantTemplates = await getRelevantTemplatesOfRule(rule);

    const ruleQuery = generateNeo4jRuleQueryAgainstPinnedEntity(rule, pinnedEntityId, relevantTemplates);

    const ruleResults = await runInTransactionAndNormalize(
        transaction,
        ruleQuery.cypherQuery,
        normalizeRuleResultsAgainstPinnedEntity,
        ruleQuery.parameters,
    );

    return ruleResults;
};

export const runRulesOnRelationshipsOfPinnedEntity = async (
    transaction: Transaction,
    pinnedEntityId: string,
    rules: IMongoRule[],
    excludedUnpinnedEntityId?: string,
) => {
    const ruleResultsForEachRulePromises = rules.map(async (rule) => {
        const ruleResults = await runRuleOnRelationshipsOfPinnedEntity(transaction, pinnedEntityId, rule);

        const ruleResultsWithoutExcludedEntity = ruleResults.filter(({ unpinnedEntityId }) => unpinnedEntityId !== excludedUnpinnedEntityId);

        return ruleResultsWithoutExcludedEntity.map(({ unpinnedRelationshipId, doesRuleStillApply }) => ({
            ruleId: rule._id,
            relationshipId: unpinnedRelationshipId,
            doesRuleStillApply,
        })) as IRuleTransactionResult[];
    });
    const ruleResultsForEachRule = await Promise.all(ruleResultsForEachRulePromises);

    return ruleResultsForEachRule.flat();
};

export const runRuleOnPair = async (
    transaction: Transaction,
    pinnedEntityId: string,
    nonPinnedEntityId: string,
    nonPinnedRelationshipId: string,
    rule: IMongoRule,
) => {
    const relevantTemplates = await getRelevantTemplatesOfRule(rule);

    const ruleQuery = generateNeo4jRuleQueryAgainstPair(rule, pinnedEntityId, nonPinnedEntityId, nonPinnedRelationshipId, relevantTemplates);

    const doesRuleStillApply = await runInTransactionAndNormalize(
        transaction,
        ruleQuery.cypherQuery,
        normalizeRuleResultAgainstPair,
        ruleQuery.parameters,
    );

    return doesRuleStillApply;
};

export const runRulesOnRelationship = async (
    transaction: Transaction,
    rules: IMongoRule[],
    relationship: IRelationship,
    sourceEntityTemplateId: string,
) => {
    const ruleResultsPromises = rules.map(async (rule) => {
        const [pinnedEntityId, nonPinnedEntityId] =
            rule.pinnedEntityTemplateId === sourceEntityTemplateId
                ? [relationship.sourceEntityId, relationship.destinationEntityId]
                : [relationship.destinationEntityId, relationship.sourceEntityId];

        const doesRuleStillApply = await runRuleOnPair(transaction, pinnedEntityId, nonPinnedEntityId, relationship.properties._id, rule);

        return { ruleId: rule._id, doesRuleStillApply, relationshipId: relationship.properties._id } as IRuleTransactionResult;
    });
    const ruleResults = await Promise.all(ruleResultsPromises);

    return ruleResults;
};
