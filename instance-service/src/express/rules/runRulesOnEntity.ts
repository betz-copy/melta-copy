import { IMongoEntityTemplate, IMongoRule } from '@packages/entity-template';
import { Transaction } from 'neo4j-driver';
import { normalizeRuleResultOnEntity, normalizeRuleResultsOnEntitiesOfTemplate, runInTransactionAndNormalize } from '../../utils/neo4j/lib';
import { generateNeo4jRuleQueryOnEntitiesOfTemplate, generateNeo4jRuleQueryOnEntity } from './generateRuleNeo4jQuery';
import { IRuleFailure } from './interfaces';

export const runRuleOnEntity = async (transaction: Transaction, entityId: string, rule: IMongoRule, entityTemplate: IMongoEntityTemplate) => {
    const ruleQuery = generateNeo4jRuleQueryOnEntity(rule, entityId, entityTemplate);

    return runInTransactionAndNormalize(transaction, ruleQuery.cypherCalculation, normalizeRuleResultOnEntity, ruleQuery.parameters);
};

// used for cronjob rules (with getToday func) that need to check all entities of template at once
export const runRuleOnEntitiesOfTemplate = async (
    transaction: Transaction,
    rule: IMongoRule,
    entityTemplate: IMongoEntityTemplate,
    getTodayFuncValue: Date,
    returnOnlyFailedResults: boolean = true,
) => {
    const ruleQuery = generateNeo4jRuleQueryOnEntitiesOfTemplate(rule, entityTemplate, getTodayFuncValue, returnOnlyFailedResults);

    return runInTransactionAndNormalize(transaction, ruleQuery.cypherCalculation, normalizeRuleResultsOnEntitiesOfTemplate, ruleQuery.parameters);
};

export const runRulesOnEntity = async (
    transaction: Transaction,
    entityId: string,
    rules: IMongoRule[],
    entityTemplate: IMongoEntityTemplate,
): Promise<IRuleFailure[]> => {
    const ruleResultsPromises = rules.map(async (rule) => {
        const ruleResult = await runRuleOnEntity(transaction, entityId, rule, entityTemplate);

        return { rule, ruleResult };
    });
    const ruleResults = await Promise.all(ruleResultsPromises);

    const ruleFailures = ruleResults
        .filter(({ ruleResult: { value } }) => !value)
        .map(({ rule, ruleResult: { formulaCauses } }) => ({ rule, entityId, formulaCauses }));
    return ruleFailures;
};
