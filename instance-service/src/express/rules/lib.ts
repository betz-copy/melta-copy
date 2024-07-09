import _groupBy from 'lodash.groupby';
import _difference from 'lodash.difference';
import { Transaction } from 'neo4j-driver';
import { IBrokenRule, IMongoRule, IRuleFailure, IRuleFailureWithCauses } from './interfaces';
import { generateNeo4jRuleQueryAgainstPair, generateNeo4jRuleQueryAgainstPinnedEntity } from './generateRuleNeo4jQuery';
import config from '../../config';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { normalizeRuleResultAgainstPair, normalizeRuleFailuresAgainstPinnedEntity, runInTransactionAndNormalize } from '../../utils/neo4j/lib';
import { ServiceError } from '../error';

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

export const getBrokenRules = (ruleFailures: IRuleFailureWithCauses[], createdRelationshipId?: string) => {
    const failuresByRuleId = _groupBy(ruleFailures, 'ruleId');

    const brokenRules = Object.entries(failuresByRuleId).map(([ruleId, failuresOfRule]) => {
        const relationshipIds = failuresOfRule.map((ruleTransactionResult) => {
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

export const throwIfActionCausedBrokenRules = (
    ignoredRules: IBrokenRule[],
    ruleFailuresBeforeAction: IRuleFailureWithCauses[],
    ruleFailuresAfterAction: IRuleFailureWithCauses[],
    createdRelationshipId?: string,
) => {
    const ruleFailuresCausedByAction = ruleFailuresAfterAction.filter((ruleFailureAfterAction) => {
        const didFailBeforeAction = ruleFailuresBeforeAction.some((currRuleFailure) => {
            return (
                currRuleFailure.ruleId === ruleFailureAfterAction.ruleId && currRuleFailure.relationshipId === ruleFailureAfterAction.relationshipId
            );
        });

        // keep failed rules that werent before OR (were before but) triggered directly and not via aggregation
        return !didFailBeforeAction || !ruleFailureAfterAction.isTriggeredViaAggregation;
    });

    const brokenRules = getBrokenRules(ruleFailuresCausedByAction, createdRelationshipId);

    if (!areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
        throw new ServiceError(400, `[NEO4J] action is blocked by rules.`, {
            errorCode: config.errorCodes.ruleBlock,
            brokenRules,
        });
    }
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

    const ruleFailures = await runInTransactionAndNormalize(
        transaction,
        ruleQuery.cypherQuery,
        normalizeRuleFailuresAgainstPinnedEntity,
        ruleQuery.parameters,
    );

    return ruleFailures;
};

export const runRulesOnRelationshipsOfPinnedEntity = async (
    transaction: Transaction,
    pinnedEntityId: string,
    rules: IMongoRule[],
    excludedUnpinnedEntityId?: string,
) => {
    const ruleFailuresForEachRulePromises = rules.map(async (rule) => {
        const ruleFailures = await runRuleOnRelationshipsOfPinnedEntity(transaction, pinnedEntityId, rule);

        const ruleFailuresWithoutExcludedEntity = ruleFailures.filter(({ unpinnedEntityId }) => unpinnedEntityId !== excludedUnpinnedEntityId);

        return ruleFailuresWithoutExcludedEntity.map(({ unpinnedRelationshipId }) => ({
            ruleId: rule._id,
            relationshipId: unpinnedRelationshipId,
        })) as IRuleFailure[];
    });
    const ruleFailuresForEachRule = await Promise.all(ruleFailuresForEachRulePromises);

    return ruleFailuresForEachRule.flat();
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
    sourceEntityId: string,
    destinationEntityId: string,
    relationshipId: string,
    sourceEntityTemplateId: string,
): Promise<IRuleFailure[]> => {
    const ruleResultsPromises = rules.map(async (rule) => {
        const [pinnedEntityId, nonPinnedEntityId] =
            rule.pinnedEntityTemplateId === sourceEntityTemplateId ? [sourceEntityId, destinationEntityId] : [destinationEntityId, sourceEntityId];

        const doesRuleStillApply = await runRuleOnPair(transaction, pinnedEntityId, nonPinnedEntityId, relationshipId, rule);

        return { ruleId: rule._id, doesRuleStillApply };
    });
    const ruleResults = await Promise.all(ruleResultsPromises);
    const ruleFailures = ruleResults.filter(({ doesRuleStillApply }) => !doesRuleStillApply);

    return ruleFailures.map(({ ruleId }) => ({ ruleId, relationshipId }));
};
