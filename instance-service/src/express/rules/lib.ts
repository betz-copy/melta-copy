/* eslint-disable class-methods-use-this */
import _difference from 'lodash.difference';
import _groupBy from 'lodash.groupby';
import { Transaction } from 'neo4j-driver';
import config from '../../config';
import { EntityTemplateManagerService } from '../../externalServices/entityTemplateManager';
import { RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';
import { normalizeRuleFailuresAgainstPinnedEntity, normalizeRuleResultAgainstPair, runInTransactionAndNormalize } from '../../utils/neo4j/lib';
import { ServiceError } from '../error';
import { generateNeo4jRuleQueryAgainstPair, generateNeo4jRuleQueryAgainstPinnedEntity } from './generateRuleNeo4jQuery';
import { IBrokenRule, IMongoRule, IRuleFailure, IRuleFailureWithCauses } from './interfaces';

const { createdRelationshipIdInBrokenRules } = config;

export default class RulesManager {
    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    private entityTemplateManagerService: EntityTemplateManagerService;

    constructor(dbName: string) {
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(dbName);
    }

    private async getRelationshipTemplatesOfEntityTemplate(entityTemplateId: string) {
        const relationshipTemplates = await Promise.all([
            this.relationshipsTemplateManagerService.searchRelationshipTemplates({ sourceEntityIds: [entityTemplateId] }),
            this.relationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: [entityTemplateId] }),
        ]);

        return relationshipTemplates.flat();
    }

    public async getRulesByEntityTemplateId(entityTemplateId: string) {
        const rules = await Promise.all([
            this.relationshipsTemplateManagerService.searchRules({ pinnedEntityTemplateIds: [entityTemplateId] }),
            this.relationshipsTemplateManagerService.searchRules({ unpinnedEntityTemplateIds: [entityTemplateId] }),
        ]);

        return rules.flat();
    }

    private getBrokenRules(ruleFailures: IRuleFailureWithCauses[], createdRelationshipId?: string) {
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
    }

    public areAllBrokenRulesIgnored(brokenRules: IBrokenRule[], ignoredRules: IBrokenRule[]) {
        return brokenRules.every((brokenRule) => {
            const ignoredRule = ignoredRules.find(({ ruleId }) => ruleId === brokenRule.ruleId);

            if (!ignoredRule) {
                return false;
            }

            return _difference(brokenRule.relationshipIds, ignoredRule.relationshipIds).length === 0;
        });
    }

    public throwIfActionCausedBrokenRules(
        ignoredRules: IBrokenRule[],
        ruleFailuresBeforeAction: IRuleFailureWithCauses[],
        ruleFailuresAfterAction: IRuleFailureWithCauses[],
        createdRelationshipId?: string,
    ) {
        const ruleFailuresCausedByAction = ruleFailuresAfterAction.filter((ruleFailureAfterAction) => {
            const didFailBeforeAction = ruleFailuresBeforeAction.some((currRuleFailure) => {
                return (
                    currRuleFailure.ruleId === ruleFailureAfterAction.ruleId &&
                    currRuleFailure.relationshipId === ruleFailureAfterAction.relationshipId
                );
            });

            // keep failed rules that werent before OR (were before but) triggered directly and not via aggregation
            return !didFailBeforeAction || !ruleFailureAfterAction.isTriggeredViaAggregation;
        });

        const brokenRules = this.getBrokenRules(ruleFailuresCausedByAction, createdRelationshipId);

        if (!this.areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
            throw new ServiceError(400, `[NEO4J] action is blocked by rules.`, {
                errorCode: config.errorCodes.ruleBlock,
                brokenRules,
            });
        }
    }

    public async getRelevantTemplatesOfRule(rule: IMongoRule) {
        const pinnedEntityRelationshipTemplates = await this.getRelationshipTemplatesOfEntityTemplate(rule.pinnedEntityTemplateId);

        const connectionsTemplates = await Promise.all(
            pinnedEntityRelationshipTemplates.map(async (relationshipTemplate) => {
                const { sourceEntityId, destinationEntityId } = relationshipTemplate;
                const otherEntityTemplateId = sourceEntityId === rule.pinnedEntityTemplateId ? destinationEntityId : sourceEntityId;

                const otherEntityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(otherEntityTemplateId);

                return { relationshipTemplate, otherEntityTemplate };
            }),
        );

        const relationshipTemplateOfRule = connectionsTemplates.find(({ relationshipTemplate: { _id } }) => _id === rule.relationshipTemplateId)!;

        return {
            pinnedEntityTemplateId: rule.pinnedEntityTemplateId,
            unpinnedEntityTemplateId: relationshipTemplateOfRule.otherEntityTemplate._id,
            connectionsTemplates,
        };
    }

    public async runRuleOnRelationshipsOfPinnedEntity(transaction: Transaction, pinnedEntityId: string, rule: IMongoRule) {
        const relevantTemplates = await this.getRelevantTemplatesOfRule(rule);

        const ruleQuery = generateNeo4jRuleQueryAgainstPinnedEntity(rule, pinnedEntityId, relevantTemplates);

        const ruleFailures = await runInTransactionAndNormalize(
            transaction,
            ruleQuery.cypherQuery,
            normalizeRuleFailuresAgainstPinnedEntity,
            ruleQuery.parameters,
        );

        return ruleFailures;
    }

    public async runRulesOnRelationshipsOfPinnedEntity(
        transaction: Transaction,
        pinnedEntityId: string,
        rules: IMongoRule[],
        excludedUnpinnedEntityId?: string,
    ) {
        const ruleFailuresForEachRulePromises = rules.map(async (rule) => {
            const ruleFailures = await this.runRuleOnRelationshipsOfPinnedEntity(transaction, pinnedEntityId, rule);

            const ruleFailuresWithoutExcludedEntity = ruleFailures.filter(({ unpinnedEntityId }) => unpinnedEntityId !== excludedUnpinnedEntityId);

            return ruleFailuresWithoutExcludedEntity.map(({ unpinnedRelationshipId }) => ({
                ruleId: rule._id,
                relationshipId: unpinnedRelationshipId,
            })) as IRuleFailure[];
        });
        const ruleFailuresForEachRule = await Promise.all(ruleFailuresForEachRulePromises);

        return ruleFailuresForEachRule.flat();
    }

    public async runRuleOnPair(
        transaction: Transaction,
        pinnedEntityId: string,
        nonPinnedEntityId: string,
        nonPinnedRelationshipId: string,
        rule: IMongoRule,
    ) {
        const relevantTemplates = await this.getRelevantTemplatesOfRule(rule);

        const ruleQuery = generateNeo4jRuleQueryAgainstPair(rule, pinnedEntityId, nonPinnedEntityId, nonPinnedRelationshipId, relevantTemplates);

        const doesRuleStillApply = await runInTransactionAndNormalize(
            transaction,
            ruleQuery.cypherQuery,
            normalizeRuleResultAgainstPair,
            ruleQuery.parameters,
        );

        return doesRuleStillApply;
    }

    public async runRulesOnRelationship(
        transaction: Transaction,
        rules: IMongoRule[],
        sourceEntityId: string,
        destinationEntityId: string,
        relationshipId: string,
        sourceEntityTemplateId: string,
    ): Promise<IRuleFailure[]> {
        const ruleResultsPromises = rules.map(async (rule) => {
            const [pinnedEntityId, nonPinnedEntityId] =
                rule.pinnedEntityTemplateId === sourceEntityTemplateId
                    ? [sourceEntityId, destinationEntityId]
                    : [destinationEntityId, sourceEntityId];

            const doesRuleStillApply = await this.runRuleOnPair(transaction, pinnedEntityId, nonPinnedEntityId, relationshipId, rule);

            return { ruleId: rule._id, doesRuleStillApply };
        });
        const ruleResults = await Promise.all(ruleResultsPromises);
        const ruleFailures = ruleResults.filter(({ doesRuleStillApply }) => !doesRuleStillApply);

        return ruleFailures.map(({ ruleId }) => ({ ruleId, relationshipId }));
    }
}
